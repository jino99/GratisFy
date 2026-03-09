import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import ytSearch from 'yt-search'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

// Search cache for performance optimization
const searchCache = new Map();

// Utility function to parse Range header
function parseRange(rangeHeader, totalSize) {
  if (!rangeHeader || !rangeHeader.startsWith('bytes=')) {
    return null;
  }
  
  const range = rangeHeader.replace(/bytes=/, '').split('-');
  const start = parseInt(range[0], 10);
  const end = range[1] ? parseInt(range[1], 10) : totalSize - 1;
  
  // Validate range
  if (start >= totalSize || end >= totalSize || start > end) {
    return null;
  }
  
  return { start, end, length: end - start + 1 };
}

// Device detection and optimal format selection
function getOptimalFormat(userAgent) {
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
  const isIOS = /iPhone|iPad/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  
  if (isIOS) {
    // iPhone/iPad: m4a for Safari compatibility
    return '140/bestaudio[ext=m4a]/bestaudio[acodec=m4a]';
  } else if (isAndroid) {
    // Android: m4a for Chrome compatibility
    return '140/bestaudio[ext=m4a]/bestaudio[acodec=m4a]';
  } else if (isMobile) {
    // Other mobile: m4a for broad compatibility
    return '140/bestaudio[ext=m4a]/bestaudio[acodec=m4a]';
  } else {
    // Desktop: opus for best quality
    return '251/bestaudio[ext=webm]/bestaudio[acodec=opus]';
  }
}

// Content type based on format
function getContentType(format) {
  if (format.includes('m4a')) return 'audio/mp4';
  if (format.includes('webm')) return 'audio/webm';
  if (format.includes('ogg')) return 'audio/ogg';
  return 'audio/webm'; // fallback
}

// Audio buffer management for pre-loading
const audioBuffers = new Map();

function serveFromBuffer(videoId, req, res) {
  const buffer = audioBuffers.get(videoId);
  if (buffer && Date.now() - buffer.timestamp < 300000) { // 5 minutes cache
    res.writeHead(200, {
      'Content-Type': buffer.contentType,
      'Content-Length': buffer.data.length,
      'Cache-Control': 'public, max-age=300',
      'ETag': buffer.etag,
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(buffer.data);
    return true;
  }
  return false;
}

function generateETag(videoId) {
  return `"${videoId}-${Date.now()}"`;
}

/**
 * Custom Vite middleware: Local YouTube Music API Server
 * Uses yt-search for reliable search and yt-dlp for streaming
 */
function localYoutubeApi() {
  return {
    name: 'local-youtube-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, `http://${req.headers.host}`)

        // --- YTM SEARCH ENDPOINT ---
        if (url.pathname === '/api/ytm/search' || url.pathname === '/api/search') {
          const query = url.searchParams.get('q')
          const offset = parseInt(url.searchParams.get('offset')) || 0
          const limit = parseInt(url.searchParams.get('limit')) || 15
          if (!query) {
            res.writeHead(400); res.end('Missing query'); return
          }

          try {
            // Check cache first
            const cacheKey = `${query}:${offset}:${limit}`;
            if (searchCache.has(cacheKey)) {
              const cached = searchCache.get(cacheKey);
              if (Date.now() - cached.timestamp < 15 * 60 * 1000) { // 15 minutes TTL
                console.log(`[Search] Cache hit for "${query}"`);
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify(cached.data));
                return;
              }
            }

            console.log(`[Search] Starting parallel search for "${query}"...`);
            const searchStart = Date.now();
            
            // Execute all searches in parallel for maximum speed
            const searchPromises = [
              ytSearch(query).catch(e => ({ error: e, query: 'base' })),
              ytSearch(query + ' music').catch(e => ({ error: e, query: 'music' })),
              ytSearch(query + ' official').catch(e => ({ error: e, query: 'official' })),
              ytSearch(query + ' song').catch(e => ({ error: e, query: 'song' })),
              ytSearch(query + ' audio').catch(e => ({ error: e, query: 'audio' })),
              ytSearch(query + ' track').catch(e => ({ error: e, query: 'track' }))
            ];
            
            const [baseResults, musicResults, officialResults, songResults, audioResults, trackResults] = await Promise.all(searchPromises);
            
            // Collect all successful results
            const allVideos = [];
            const seen = new Set();
            
            // Process base results
            if (!baseResults.error && baseResults.videos) {
              baseResults.videos.forEach(v => {
                if (!seen.has(v.videoId)) {
                  seen.add(v.videoId);
                  allVideos.push(v);
                }
              });
            }
            
            // Process additional results only if we need more and this is the first page
            if (offset === 0 && allVideos.length < 100) {
              [musicResults, officialResults, songResults, audioResults, trackResults].forEach((result, index) => {
                if (!result.error && result.videos) {
                  result.videos.forEach(v => {
                    if (!seen.has(v.videoId)) {
                      seen.add(v.videoId);
                      allVideos.push(v);
                    }
                  });
                }
              });
            }
            
            const searchTime = Date.now() - searchStart;
            console.log(`[Search] Parallel search completed in ${searchTime}ms - ${allVideos.length} unique results`);
            
            const songs = allVideos.slice(offset, offset + limit).map(v => ({
              videoId: v.videoId,
              title: v.title,
              artist: v.author.name,
              thumbnail: v.thumbnail,
              duration: v.seconds,
              timestamp: v.timestamp
            }));

            const responseData = {
              songs,
              totalResults: allVideos.length,
              hasMore: offset + limit < allVideos.length,
              searchTime: searchTime
            };
            
            // Cache the results
            searchCache.set(cacheKey, {
              data: responseData,
              timestamp: Date.now()
            });
            
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(responseData))
          } catch (err) {
            console.error('[Search Error]', err)
            res.writeHead(500); res.end(JSON.stringify({ error: err.message }))
          }
          return
        }

        // --- YTM STREAM ENDPOINT ---
        if (url.pathname === '/api/ytm/stream' || url.pathname === '/api/stream') {
          const videoId = url.searchParams.get('videoId')
          const userAgent = req.headers['user-agent'] || '';
          if (!videoId) {
            res.writeHead(400); res.end('Missing videoId'); return
          }

          // Check if we have this buffered
          if (serveFromBuffer(videoId, req, res)) {
            console.log(`[Stream] Serving from buffer: ${videoId}`);
            return;
          }

          const range = req.headers.range;
          const optimalFormat = getOptimalFormat(userAgent);
          
          try {
            console.log(`[Stream] Starting optimized stream for ${videoId} (${optimalFormat})...`);
            const isWindows = process.platform === 'win32'
            const ytDlpPath = path.resolve(process.cwd(), 'bin', isWindows ? 'yt-dlp.exe' : 'yt-dlp')

            // For range requests, we need to handle them differently
            if (range) {
              // Handle Range request - return 206 Partial Content
              const ytDlp = spawn(ytDlpPath, [
                '--js-runtime', 'node',
                '-f', optimalFormat,
                '-o', '-',  // Output to stdout
                '--quiet',
                '--no-progress',
                '--buffer-size', '64K',
                '--extractor-args', 'youtube:skip=dash',
                '--no-check-certificate',
                `https://music.youtube.com/watch?v=${videoId}`
              ])

              ytDlp.on('error', (err) => {
                console.error('[yt-dlp Spawn Error]', err)
                if (!res.headersSent) { res.writeHead(500); res.end('Spawn failed: ' + err.message) }
              })

              let buffer = Buffer.alloc(0);
              
              ytDlp.stdout.on('data', (chunk) => {
                buffer = Buffer.concat([buffer, chunk]);
              });

              ytDlp.stdout.on('end', () => {
                const totalSize = buffer.length;
                const parsedRange = parseRange(range, totalSize);
                
                if (!parsedRange) {
                  res.writeHead(416, { 'Content-Range': `bytes */${totalSize}` });
                  res.end();
                  return;
                }

                const chunk = buffer.slice(parsedRange.start, parsedRange.end + 1);
                const contentType = getContentType(optimalFormat);
                const etag = generateETag(videoId);
                
                // Cache the full buffer for future requests
                audioBuffers.set(videoId, {
                  data: buffer,
                  contentType: contentType,
                  etag: etag,
                  timestamp: Date.now()
                });
                
                res.writeHead(206, {
                  'Content-Range': `bytes ${parsedRange.start}-${parsedRange.end}/${totalSize}`,
                  'Accept-Ranges': 'bytes',
                  'Content-Length': parsedRange.length,
                  'Content-Type': contentType,
                  'Cache-Control': 'public, max-age=300',
                  'ETag': etag,
                  'Access-Control-Allow-Origin': '*'
                });
                
                res.end(chunk);
                console.log(`[Stream] Range request served: bytes ${parsedRange.start}-${parsedRange.end}/${totalSize} (${contentType})`);
              });

              ytDlp.stderr.on('data', (data) => {
                console.log(`[yt-dlp] ${data.toString().trim()}`)
              });

              ytDlp.on('close', (code) => {
                if (code !== 0 && code !== null) {
                  console.error(`[yt-dlp] Process exited with code ${code}`)
                  if (!res.writableEnded) res.end()
                }
              });

              req.on('close', () => {
                ytDlp.kill()
              })

            } else {
              // Regular stream request - return 200 OK with optimal format
              const ytDlp = spawn(ytDlpPath, [
                '--js-runtime', 'node',
                '-f', optimalFormat,
                '-o', '-',
                '--quiet',
                '--no-progress',
                '--buffer-size', '64K',
                '--extractor-args', 'youtube:skip=dash',
                '--no-check-certificate',
                `https://music.youtube.com/watch?v=${videoId}`
              ])

              ytDlp.on('error', (err) => {
                console.error('[yt-dlp Spawn Error]', err)
                if (!res.headersSent) { res.writeHead(500); res.end('Spawn failed: ' + err.message) }
              })

              let buffer = Buffer.alloc(0);
              
              ytDlp.stdout.on('data', (chunk) => {
                buffer = Buffer.concat([buffer, chunk]);
              });

              ytDlp.stdout.on('end', () => {
                const totalSize = buffer.length;
                const contentType = getContentType(optimalFormat);
                const etag = generateETag(videoId);
                
                // Cache the full buffer for future requests
                audioBuffers.set(videoId, {
                  data: buffer,
                  contentType: contentType,
                  etag: etag,
                  timestamp: Date.now()
                });
                
                res.writeHead(200, {
                  'Content-Type': contentType,
                  'Content-Length': totalSize,
                  'Cache-Control': 'public, max-age=300',
                  'ETag': etag,
                  'Accept-Ranges': 'bytes',
                  'Access-Control-Allow-Origin': '*'
                });
                
                res.end(buffer);
                console.log(`[Stream] Full stream served: ${totalSize} bytes (${contentType})`);
              });

              ytDlp.stderr.on('data', (data) => {
                console.log(`[yt-dlp] ${data.toString().trim()}`)
              });

              ytDlp.on('close', (code) => {
                if (code !== 0 && code !== null) {
                  console.error(`[yt-dlp] Process exited with code ${code}`)
                  if (!res.writableEnded) res.end()
                } else if (code === null) {
                  console.log('[yt-dlp] Process terminated (null code), likely killed by request close')
                  if (!res.writableEnded) res.end()
                } else {
                  console.log('[yt-dlp] Stream finished successfully')
                  if (!res.writableEnded) res.end()
                }
              });

              req.on('close', () => {
                ytDlp.kill()
              })
            }

          } catch (err) {
            console.error('[API Stream Setup Error]', err)
            if (!res.headersSent) {
              res.writeHead(500); res.end('Internal Server Error')
            }
          }
          return
        }

        next()
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), localYoutubeApi()],
})
