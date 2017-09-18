var markd = require("simplemde")
module.exports = [{
  name: "Bold",
  action: markd.toggleBold,
  className: "fa fa-bold",
  title: "Bold",
}, {
  name: "Italic",
  action: markd.toggleItalic,
  className: "fa fa-italic",
  title: "Italic"
}, {
  name: "Code",
  action: markd.toggleCodeBlock,
  className: "fa fa-code",
  title: "Code"
}, {
  name: "Generic List",
  action: markd.toggleUnorderedList,
  className: "fa fa-list-ul",
  title: "Generic List"
}, {
  name: "Numbered List",
  action: markd.toggleOrderedList,
  className: "fa fa-list-ol",
  title: "Numbered List"
}, {
  name: "Preview",
  action: markd.togglePreview,
  className: "fa fa-eye no-disable",
  title: "Preview"
}]