

1. presents a cached copy of remote URLs (eg gdoc export URLs)

2. polls the remote server

3. when it changes, run diff, and offer change via SSE

4. the cached copy gets a little script injected which uses SSE to get and apply the patches



inject?  right after <head> put our script, which opens SSE to our
server address and applies them.

rename:

 live-update-proxy



