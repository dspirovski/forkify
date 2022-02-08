import View from "./View.js";
import previewView from "./previewView.js";

//Generating the left class, the one that appears when the user search for a result;
class BookmarksView extends View {
  _parentElement = document.querySelector(".bookmarks__list");
  _errorMessage = "No bookmarks yet. Find a nice recipe and bookmark it!";
  _message = "";

  addHandlerRender(handler) {
    window.addEventListener("load", handler);
  }

  _generateMarkup() {
    return this._data
      .map(bookmark => previewView.render(bookmark, false)).join("");
  };
};

export default new BookmarksView();