import { async } from "regenerator-runtime";
import { API_URL, RES_PER_PAGE, KEY } from "./config.js";
import { AJAX } from "./helpers.js";
// import { getJSON, sentJSON } from "./helpers.js";

export const state = {
  recipe: {},
  search: {
    query: "",
    results: [],
    resultsPerPage: RES_PER_PAGE,
    page: 1,
  },
  bookmarks: [],
};

const createRecipeObject = function (data) {
  const { recipe } = data.data;
  return {
    id: recipe.id,
    title: recipe.title,
    publisher: recipe.publisher,
    sourseUrl: recipe.sourse_url,
    image: recipe.image_url,
    servings: recipe.servings,
    cookingTime: recipe.cooking_time,
    ingredients: recipe.ingredients,
    //if recipe.key has some value (is not falsy value), then return key: recipe.key
    ...(recipe.key && { key: recipe.key }),
  };
}

export const loadRecipe = async function (id) {
  try {
    const data = await AJAX(`${API_URL}${id}?key=${KEY}`);
    state.recipe = createRecipeObject(data);
    //Check if the current recipe is in the bookmarked array
    if (state.bookmarks.some(bookmark => bookmark.id === id))
      state.recipe.bookmarked = true
    else state.recipe.bookmarked = false;
  } catch (err) {
    console.error(`${err}`);
    throw err;
  }
};

export const loadSearchResults = async function (query) {
  state.search.query = query;
  try {
    const data = await AJAX(`${API_URL}?search=${query}&key=${KEY}`)
    console.log(data);

    state.search.results = data.data.recipes.map(rec => {
      return {
        id: rec.id,
        title: rec.title,
        publisher: rec.publisher,
        image: rec.image_url,
        ...(rec.key && { key: rec.key }),
      }
    })
    state.search.page = 1;
  } catch (err) {
    console.error(`${err}`);
    throw err;
  }
};

//page 1 = from 0 to 9
//page 2 = from 10 to 19
//page 3 = from 20 to 29...
export const getSearchResultsPage = function (page = state.search.page) {
  state.search.page = page;
  const start = (page - 1) * state.search.resultsPerPage; // initial 0;
  const end = page * state.search.resultsPerPage; // initial 9;

  return state.search.results.slice(start, end);
};

export const updateServings = function (newServings) {
  //newQt = oldQt * newServings / oldServings; 
  state.recipe.ingredients.forEach(ing => {
    ing.quantity = ing.quantity * newServings / state.recipe.servings;
  });

  state.recipe.servings = newServings;
};

//Sent data (for bookmark recipes) to a local storage
const persistBookmarks = function () {
  localStorage.setItem("bookmarks", JSON.stringify(state.bookmarks))
}

export const addBookmark = function (recipe) {
  //Add bookmark
  state.bookmarks.push(recipe);

  //Mark current recipe as bookmark
  if (recipe.id === state.recipe.id) state.recipe.bookmarked = true;
  persistBookmarks();
};

export const deleteBookmark = function (id) {
  //Delete bookmark
  const index = state.bookmarks.findIndex(el => el.id === id)
  state.bookmarks.splice(index, 1);

  //Mark current recipe as not bookmark
  if (id === state.recipe.id) state.recipe.bookmarked = false;
  persistBookmarks();
};

//Take the data from local storage
const init = function () {
  const storage = localStorage.getItem("bookmarks");
  //Convert string to a object only if there is any data in local storage
  if (storage) state.bookmarks = JSON.parse(storage);
};
init();

export const uploadRecipe = async function (newRecipe) {
  try {

    const ingredients = Object.entries(newRecipe).filter(
      entry => entry[0].startsWith("ingredient") && entry[1] !== ""
    ).map(ing => {
      // const ingrArr = ing[1].replaceAll(" ", "").split(",");
      const ingrArr = ing[1].split(",").map(el => el.trim());
      if (ingrArr.length !== 3) throw new Error("Wrong ingrediant format. Please use the correct format.")
      const [quantity, unit, description] = ingrArr;
      return { quantity: quantity ? +quantity : null, unit, description };
    });

    const recipe = {
      title: newRecipe.title,
      source_url: newRecipe.sourceUrl,
      image_url: newRecipe.image,
      publisher: newRecipe.publisher,
      cooking_time: +newRecipe.cookingTime,
      servings: +newRecipe.servings,
      ingredients,
    };
    const data = await AJAX(`${API_URL}?key=${KEY}`, recipe);
    state.recipe = createRecipeObject(data);
    addBookmark(state.recipe);
  } catch (err) {
    throw err;
  }
};