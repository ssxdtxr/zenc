export type Theme = "light" | "dark"

export const THEME_STORAGE_KEY = "zerc-theme"
export const DEFAULT_THEME: Theme = "light"

export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark")t="${DEFAULT_THEME}";document.documentElement.setAttribute("data-theme",t)}catch(e){document.documentElement.setAttribute("data-theme","${DEFAULT_THEME}")}})();`
