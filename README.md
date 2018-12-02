
## Quilt Server

(Name comes from "quiet live update")

Most live-update servers are meant for developers.  This is meant from
production use, at least small-ish scale.

See test.js for an example

Your code calls quilt.doc(docname, docHTML) whenever you've got some
new HTML ready, like whenever the source data changes, and quilt makes
sure any users see the updated text.  Does minimal DOM changes when
possible, so the user shouldn't mind.
