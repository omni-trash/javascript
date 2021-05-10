/*
v1.21.4.20
*/

(function(window) {
	"use strict";

	// loaders
	if (typeof define === 'function' && define.amd) {
		// AMD
		define(['jquery'], register);
	} else if (typeof exports === 'object' && typeof require === 'function') {
		// Browserify
		register(require('jquery'));
	} else if (typeof jQuery === 'function') {
		// Global jQuery
		register(jQuery);
	} else if (typeof window === 'object') {
		// Native Support
		window["autocomplete"] = (window["autocomplete"] || autocomplete);
	}

	// register plugin
	function register($) {
		$.fn.autocomplete = $.fn.autocomplete || function(options) {
			return this.filter('input').each(function() {
				autocomplete(this, options);
			});
		}
	}

	// 1. search
	// 2. render
	// 3. apply
	// 4. validate

	function autocomplete(input, options) {
		// maybe a factory
		if (typeof options === "function") {
			options = options.call(input);
		}

		// ensure exist and provide default callbacks if needed,
		// but they should be provided by the consumer
		options = fixOptions(options, input);

		// the current list to show
		var list = null;

		// the current listitem to use
		var selectedItem = null;

		// the last search term
		var lastSearchTerm = null;

		// array with items of last seach
		var lastSearchResult = null;

		// we have to prepare the input element
		// we need a container around
		var container = options.container;

		if (!container) {
			// create a container
			container = document.createElement("DIV");
			container.setAttribute("class", "autocomplete-container");

			// replace the input by the container
			input.parentNode.replaceChild(container, input);

			// add the input to the container inside
			container.appendChild(input);
		}

		// prepare input
		input.setAttribute("autocomplete", "off");
		input.setAttribute("spellcheck", false);
		input.removeAttribute("list");

		// reset the list data
		function reset() {
			if (!list) {
				return;
			}

			// remove the list from DOM
			if (list.parentNode){
				list.parentNode.removeChild(list);
			}

			list = null;
			selectedItem = null;
			lastSearchTerm = null;
			lastSearchResult = null;
		}

		// set the selected item, internal use
		function setSelectedItem(listItem) {
			if (listItem === selectedItem){
				return;
			}

			// remove state
			if (selectedItem) {
				selectedItem.classList.remove("autocomplete-listitem-active");
			}

			// next item
			selectedItem = listItem;

			// set state
			if (selectedItem) {
				selectedItem.classList.add("autocomplete-listitem-active");
				ensureVisible();
			}
		}

		// set focus to next listitem
		function onKeyDown() {
			if (!isVisible()) {
				return;
			}

			setSelectedItem((selectedItem && selectedItem.nextSibling) || list.firstChild);
		}

		// set focus to previous listitem
		function onKeyUp() {
			if (!isVisible()) {
				return;
			}

			setSelectedItem((selectedItem && selectedItem.previousSibling) || list.lastChild);
		}
		
		// set focus to first item
		function onKeyHome() {
			if (!isVisible()) {
				return;
			}
			
			setSelectedItem(list.firstChild);
		}
		
		// set focus to last item
		function onKeyEnd() {
			if (!isVisible()) {
				return;
			}

			setSelectedItem(list.lastChild);
		}

		// set focus to first visible item
		function onKeyPageUp() {
			if (!isVisible()) {
				return;
			}
			
			if (!selectedItem) {
				onKeyDown();
				return;
			}

			var listLayout = getLayout(list);
			var itemLayout = getLayout(selectedItem);
			var numItems   = parseInt(listLayout.clientBox.height / itemLayout.outerBox.height) || 1;
			var listItem   = selectedItem;

			while (numItems-- > 0 && listItem.previousSibling) {
				listItem = listItem.previousSibling;
			}

			list.scrollTop += (listItem.offsetTop - selectedItem.offsetTop);
			setSelectedItem(listItem);
		}
		
		// set focus to last visible item
		function onKeyPageDown() {
			if (!isVisible()) {
				return;
			}
			
			if (!selectedItem) {
				onKeyDown();
				return;
			}
			
			var listLayout = getLayout(list);
			var itemLayout = getLayout(selectedItem);
			var numItems   = parseInt(listLayout.clientBox.height / itemLayout.outerBox.height) || 1;
			var listItem   = selectedItem;

			while (numItems-- > 0 && listItem.nextSibling) {
				listItem = listItem.nextSibling;
			}
			
			list.scrollTop += (listItem.offsetTop - selectedItem.offsetTop);
			setSelectedItem(listItem);
		}

		// apply the listitem value
		function applyItem(listitem) {
			// data item from consumer
			var item = (listitem && listitem.item) || null;

			// lastSearchResult will be null after reset
			var items = lastSearchResult;

			// no longer needed
			reset();

			// we're done
			if (input.validated) {
				return;
			}

			// at this point the input value is valid for us
			input.validated = true;

			if (listitem) {
				// user has select an item from the list
				(options.apply && options.apply.call(options, input, item));
			} else {
				// user has not select an item from list
				// we should validate the input value with
				// the underlying data items taken from consumer
				(options.validate && options.validate.call(options, input, items || []));
			}
		}

		// returns true if the list is visible
		// the list is not showing if they are no items to show
		// or the list is currently hidden (no parent)
		function isVisible() {
			return (list && list.parentNode === container);
		}

		// hide the list
		function hide() {
			if (list && isVisible()) {
				container.removeChild(list);
			}
		}

		// show the list
		function show(alignHeight) {
			if (!list || isVisible()) {
				return;
			}
			
			// positioning
			var containerLayout = getLayout(container);

			// under the input
			list.style.top   = containerLayout.clientBox.height + "px";
			list.style.width = "auto";

			// make visible
			container.appendChild(list);

			// Fix IE11 minWidth 
			var layout = getLayout(list);
			
			if (layout.borderBox.width < containerLayout.clientBox.width) {
				list.style.width = containerLayout.clientBox.width + "px";
			}

			// resize the visible rect of the list to match the elements
			if (alignHeight && list.childNodes.length > 1 && list.scrollHeight > list.clientHeight) {
				var itemLayout = null;

				for (var i = 0; i < list.childNodes.length; ++i) {
					var child = list.childNodes[i];
					var childLayout = getLayout(child);

					if (!itemLayout || childLayout.outerBox.height > itemLayout.outerBox.height) {
						itemLayout = childLayout;
					}
				}

				for (var i = 0; i < list.childNodes.length; ++i) {
					var child = list.childNodes[i];
					child.style.height = itemLayout.borderBox.height + "px";
				}

				var listLayout = getLayout(list);
				var numItems   = parseInt(listLayout.clientBox.height / itemLayout.outerBox.height);

				if (numItems) {
					var listHeight = listLayout.border.top + (numItems * itemLayout.outerBox.height) + listLayout.border.bottom;

					if (numItems > 1) {
						listHeight -= ((numItems - 1) * Math.min(itemLayout.margin.top, itemLayout.margin.bottom));
					}

					list.style.height = listHeight + "px";
				}
			}
		}

		// show/hide the list
		function toggle() {
			if (list && list.parentNode === container) {
				hide();
			} else {
				show();
			}
		}

		// starts a search
		function search(searchTerm) {
			// we start the seach async, so the DOM has time to set all states to elements
			window.setTimeout(function() {
				// the input element should have the focus
				if (document.activeElement === input) {
					searchInternal(searchTerm);
				}
			}, 10);
		}

		// when we have a search result
		function applySearchResult(items, searchTerm) {
			// reset list data
			reset();

			// track the value to prevent muliple searchs
			lastSearchTerm = searchTerm;

			// at this point the input value is not vaild anymore for us
			input.validated = false;
			
			if (!items || items.length === 0) {
				// no result, nothing to show
				return;
			}

			// remember for validation
			lastSearchResult = items;

			// create a new list
			list = document.createElement("DIV");
			list.setAttribute("class", "autocomplete-list");

			items.forEach(function(item) {
				// each item in the list has its own container
				var listitem = document.createElement("DIV");
				listitem.setAttribute("class", "autocomplete-listitem");
				listitem.addEventListener("click", clickHandler);
				listitem.addEventListener("mousedown", clickHandler);

				// assign the item to the node for later use
				listitem.item = item;

				// render listitem by consumer
				(options.render && options.render.call(options, searchTerm, listitem));

				// add the listitem to the list
				list.appendChild(listitem);
			});

			// we should show search results but the input dont have the focus
			// so we fix them and the input has to validate again the list.
			if (document.activeElement !== input) {
				input.value = searchTerm;
				input.focus();
			}

			// each listitem should have the same height
			var alignHeight = (options.alignHeights !== false);
			show(alignHeight);
		}

		// starts a search
		function searchInternal(searchTerm) {
			if (lastSearchTerm !== searchTerm) {
				// let the consumer search or filter whatever
				options.search.call(options, searchTerm, function(result) {
					applySearchResult(result, searchTerm);
				});
			}
		}

		// when a listitem was clicked
		function clickHandler(e) {
			applyItem(this);
		}

		// when the input changed
		function inputHandler(e) {
			search(input.value);
		}

		// when the input changed
		function changeHandler(e) {
			search(input.value);
		}

		// when the input got the foucs
		function focusinHandler(e) {
			// keep the focus on input
			// Fix for IE11
			if (list && e.relatedTarget === list) {
				// input.focus() from focusinHandler
				// it was the list but it should be the input
				return;
			}

			search(input.value);
		}

		// when the input or the list lost the foucs
		function focusoutHandler(e) {
			// keep the focus on input
			// Fix for IE11
			if (list && e.relatedTarget === list) {
				// not cancelable
				stopEvent(e);

				// back to the input
				input.focus();
				return;
			}

			// list should be visible only, if the input has the focus		
			if (e.relatedTarget !== input) {
				hide();

				// need to trigger that whe lost the focus
				// and we dont have a selection. if the current value
				// is always validated, no happens.
				// If not then options.validate is called.
				applyItem(null);
				return;
			}
		}

		// helper, try to stop event, even it its not cancelable
		function stopEvent(e) {
			// dont call remaining listeners
			e.stopImmediatePropagation();
			// cancelBubble
			e.stopPropagation();
			// no default action
			e.preventDefault();
		}

		var KEYCODE = { DOWN: 40, UP: 38, ENTER: 13, TAB: 9, ESC: 27, PAGEUP: 33, PAGEDOWN: 34, END: 35, HOME: 36 };

		// handle the input keys
		function keyupHandler(e) {
			// we need a list
			if (!list) {
				// ok we keep the focus on input and do not submit the form or other stuff
				if (e.keyCode == KEYCODE.ENTER) {
					stopEvent(e);
				}

				return;
			}

			// if user holds SHIFT we do nothing
			if (e.shiftKey) {
				return;
			}

			// let's go
			switch (e.keyCode) {
				case KEYCODE.DOWN:
					onKeyDown();
					break;
				case KEYCODE.UP:
					onKeyUp();
					break;
				case KEYCODE.HOME:
					// key is for input to move the cursur at start
					if (!e.ctrlKey) {
						return;
					}

					// use CTRL + HOME
					onKeyHome();
					break;
				case KEYCODE.END:
					// key is for input to move the cursor at end
					if (!e.ctrlKey) {
						return;
					}

					// use CTRL + END
					onKeyEnd();
					break;
				case KEYCODE.PAGEUP:
					onKeyPageUp();
					break;
				case KEYCODE.PAGEDOWN:
					onKeyPageDown();
					break;
				case KEYCODE.ENTER:
					// apply the value form list only if the list is showing
					if (isVisible()) {
						applyItem(selectedItem);
					}

					break;
				case KEYCODE.TAB:
					// apply the value form list only if the list is showing
					if (isVisible()) {
						applyItem(selectedItem);
					}

					// dont stop evening focus out
					return;
				case KEYCODE.ESC:
					toggle();
					break;
				default:
					return;
			}

			stopEvent(e);
		}

		// box layout helper
		function getLayout(element) {
			var style = getComputedStyle(element);

			// integer
			function pix(value){
				return Math.round(parseFloat(value) || 0);
			}

			var layout =  {
				outerBox: {
					width:  0,
					height: 0
				},
				margin: {
					left:   pix(style.marginLeft),
					top:    pix(style.marginTop),
					right:  pix(style.marginRight),
					bottom: pix(style.marginBottom)
				},
				borderBox: {
					width:  element.offsetWidth,
					height: element.offsetHeight
				},
				border: {
					left:   pix(style.borderLeftWidth),
					top:    pix(style.borderTopWidth),
					right:  pix(style.borderRightWidth),
					bottom: pix(style.borderBottomWidth)
				},
				clientBox: {
					width:  element.clientWidth,
					height: element.clientHeight
				},
				padding: {
					left:   pix(style.paddingLeft),
					top:    pix(style.paddingTop),
					right:  pix(style.paddingRight),
					bottom: pix(style.paddingBottom)
				},
				contentBox: {
					width:  0,
					height: 0
				}
			};

			// calculate
			layout.outerBox.width    = layout.borderBox.width  + layout.margin.left  + layout.margin.right;
			layout.outerBox.height   = layout.borderBox.height + layout.margin.top   + layout.margin.bottom;

			// calculate
			layout.contentBox.width  = layout.clientBox.width  - layout.padding.left - layout.padding.right;
			layout.contentBox.height = layout.clientBox.height - layout.padding.top  - layout.padding.bottom;

			return layout;
		}

		// ensure that the selected item is visible inside the list
		function ensureVisible() {
			if (!isVisible() || !selectedItem) {
				return;
			}

			// https://www.javascripttutorial.net/javascript-dom/javascript-width-height/
			// https://www.javascripttutorial.net/dom/css/get-and-set-scroll-position-of-an-element/
			//
			// offsetTop is the distance of the outer border of the current element 
			// relative to the inner border of the top of the offsetParent node
			//
			// except:
			// 	- style.display  is none
			// 	- style.position is fixed

			var listLayout   = getLayout(list);
			var itemLayout   = getLayout(selectedItem);
			var offsetTop    = (selectedItem.offsetTop || 0) - itemLayout.margin.top;
			var offsetBottom = offsetTop + itemLayout.outerBox.height;

			// over the visible box
			if (offsetTop < list.scrollTop) {
				list.scrollTop = offsetTop;
			}

			// under the visible box
			if (offsetBottom > list.scrollTop + listLayout.clientBox.height) {
				list.scrollTop = offsetBottom - listLayout.clientBox.height;
			}
		}

		// attach to events
		input.addEventListener("input",    inputHandler);
		input.addEventListener("change",   changeHandler);
		input.addEventListener("keydown",  keyupHandler);
		input.addEventListener("focusin",  focusinHandler);
		input.addEventListener("focusout", focusoutHandler);
	}
	
	// the consumer should provide all callbacks in options for autocomplete
	function fixOptions(options, input) {
		options = (options || {});

		if (options.render && options.apply && options.validate && typeof options.search === "function") {
			// all ok, nothing to fix
			return options;
		}

		// internal
		function staticLookup(lookup) {
			if (!lookup) {
				// try to use the list attribute (datalist)
				var datalistId = input.getAttribute("list");

				if (datalistId) {
					var datalist = document.getElementById(datalistId);
					var options  = (datalist && datalist.querySelectorAll("option"));

					lookup = options;
				}
			}

			// check the lookup is a node
			if (lookup && lookup.nodeType === Node.ELEMENT_NODE && lookup.childNodes) {
				lookup = lookup.childNodes;
			}

			// we need an array, whatever lookup was at this point
			lookup = [].slice.call(lookup || []);

			// check the lookup is a nodelist
			if (lookup.length > 0 && typeof lookup[0].nodeType === "number") {
				lookup = lookup.map(function(node) {
					// like a option element
					var label = node.getAttribute("label") || ("".trim && node.innerText.trim()) || node.getAttribute("value");
					var value = node.getAttribute("value") || label;

					return {
						value: value,
						label: label
					};
				});
			}

			return lookup;
		}
		
		// internal
		function defaultItemString(item) {
			if (typeof item !== "object") {
				return item;
			}

			var values = [];
			
			Object.keys(item).forEach(function(key) {
				if (typeof item[key] !== "function") {
					values.push(item[key]);
				}
			});

			return values.join(" ");
		}

		// internal, provide default options
		var defaultOptions = {
			search: (function() {
				var internal = {
					searchId: 0,
					resultCache: {},
					lookup: []
				};

				function search(searchTerm, resolve) {
					var id = ++internal.searchId;

					window.setTimeout(function(){
						if (internal.searchId !== id) {
							// outdated
							return;
						}

						var searchTermUpper = searchTerm.toUpperCase();
						var cackeKey = "cache:" + searchTermUpper;

						var result = internal.resultCache[cackeKey] || internal.lookup.filter(function(item) {
							var labelUpper = ((item && item.label) || (item && item.value) || defaultItemString(item)).toUpperCase();
							var valueUpper = ((item && item.value) || (item && item.label) || defaultItemString(item)).toUpperCase();

							return (labelUpper.indexOf(searchTermUpper) >= 0 || valueUpper.indexOf(searchTermUpper) >= 0)
						});

						internal.resultCache[cackeKey] = result;
						resolve(result);
					}, 10);
				}

				// make public available
				search.internal = internal;
				return search;
			}()),
			render: function(searchTerm, listItem) {
				var item = listItem.item;
				var valueElement = document.createElement("span");
				var labelElement = document.createElement("span");

				valueElement.classList.add("autocomplete-listitem-value");
				labelElement.classList.add("autocomplete-listitem-label");
				
				valueElement.innerText = ((item && item.value) || defaultItemString(item)).replace("<", "&lt;").replace(">", "&gt;");
				labelElement.innerText = ((item && item.label) || defaultItemString(item)).replace("<", "&lt;").replace(">", "&gt;");

				if (searchTerm) {
					// special mapping
                    			var special = { "]": "\\]", "\\": "\\\\" };
                    			var pattern = "([" + searchTerm.split("").map(function (c) { return (special[c] || c); }).join("][") + "])";
                    			var regexp  = new RegExp(pattern, "gi");

					valueElement.innerHTML = valueElement.innerText.replace(regexp, "<span class='autocomplete-listitem-highlight'>$1</span>");
					labelElement.innerHTML = labelElement.innerText.replace(regexp, "<span class='autocomplete-listitem-highlight'>$1</span>");
				}

				listItem.appendChild(valueElement);

				if (valueElement.innerHTML != labelElement.innerHTML) {
					listItem.appendChild(labelElement);
				}
			},
			apply: function(input, item) {
				input.value = (item && typeof item.value === "string" ? item.value : defaultItemString(item))
				input.title = (item && typeof item.label === "string" ? item.label : defaultItemString(item))

				var label = document.getElementById(input.getAttribute('data-autocomplete-label'));

				if (label) {
					label.innerText = input.title;
				}
			},
			validate: function(input, items) {
				if (items.length == 1) {
					this.apply(input, items[0]);
					return;
				}

				// accept the input as is
				input.value = input.value;
				input.title = "";

				var label = document.getElementById(input.getAttribute('data-autocomplete-label'));

				if (label) {
					label.innerText = input.title;
				}
			}
		};

		// trace a warning;
		(console && console.warn && console.warn("you should provide all callbacks in options for autocomplete"));

		if (typeof options.search !== "function") {
			defaultOptions.search.internal.lookup = staticLookup(options.search);
			options.search = defaultOptions.search;
		}

		options.render   = options.render    || defaultOptions.render;
		options.apply    = options.apply     || defaultOptions.apply;
		options.validate = options.validate  || defaultOptions.validate;

		return options;
	}
}(this["self"]));
