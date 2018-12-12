
## Quilt Server

(Name comes from "quiet live update")

Most live-update servers are meant for developers.  This is meant from
production use, at least small-ish scale.

Serve static files (through us or someone else).  Embed in those files
a script tag (or we could inject it) which which causes the browser to
open an eventstream back to use for changes.  We watch the filesystem
for changes, and send them as they happen.

Someday: go back to having an API, for when you don't want to go
through the filesystem

Someday: Add client side UI with pause/resume, next-prev versions,
show versions, etc.
