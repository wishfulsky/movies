/// <reference path="backack.js" />
/// <reference path="helper.extensions.js" />
;

(function (window, undefined) {

    "use strict";

    var _gaq = _gaq || undefined;

    // Define a local copy of deferred
    var spa = function (customSettings) {

        var that = new spa.fn.init();

        that.settings = $().extend({}, that.settings, customSettings);

        that.bp = that.settings.bp || backpack();

        that.titleElement = document.querySelector(that.settings.titleSelector);

        if (that.settings.parseDOM) {

            that.setupRoutes(that.settings.viewSelector);

        }

        window.addEventListener("hashchange", function () {

            that.swapView();

        });

        if (that.getParameterByName(that.settings.forceReload)) {

            window.location.replace(window.location.href.split("?")[0] + "#!" +
                    that.getParameterByName(that.settings.forceReload));
            return that;

        } else if (that.settings.initView) {
            that.swapView();
        }

        if (that.settings.asyncUrl && typeof that.settings.asyncUrl === "string") {

            document.addEventListener("DOMContentLoaded", function () {

                e.target.removeEventListener(e.type, arguments.callee);

                that.loadAsyncContent.call(that, that.settings.asyncUrl);
            });
        }

        return that;

    };

    spa.fn = spa.prototype = {

        constructor: spa,

        init: function () {
            return this;
        },

        version: "0.0.4",

        bp: undefined,

        setupRoutes: function () {

            var that = this,
                $$ = $(),
                routes = $$.extend($$.parseLocalStorage("routes") || {}, that.settings.routes),
                i = 0, rawPath, view, route, viewId,
                Views = document.querySelectorAll(that.settings.viewSelector);

            for (; i < Views.length; i++) {

                view = Views[i];

                if (view.hasAttributes() && view.hasAttribute("id")) {

                    viewId = view.getAttribute("id");
                    rawPath = (view.hasAttribute("data-route") ? view.getAttribute("data-route") : "");

                    route = that.createRoute(viewId, rawPath, view);
                    routes[route.path] = route;

                }

            }

            that.settings.routes = routes;

            localStorage.setItem("routes", JSON.stringify(routes));

            if (that.bp && (that.getParameterByName("_escaped_fragment_") === "")) {
                that.bp.updateViews(that.settings.viewSelector);
            }

        },

        createRoute: function (viewId, rawPath, view) {

            //need to check for duplicate path
            return {
                viewId: viewId,
                path: rawPath.split("\\:")[0],
                params: rawPath.split("\\:").slice(1),
                title: (view.hasAttribute("data-title") ? view.getAttribute("data-title") :
                        this.settings.defaultTitle),
                transition: (view.hasAttribute("data-transition") ?
                        view.getAttribute("data-transition") :
                        ""),
                paramValues: {},
                onload: (view.hasAttribute("data-onload") ? view.getAttribute("data-onload") : undefined), //"load" + viewId),
                unload: (view.hasAttribute("data-unload") ? view.getAttribute("data-unload") : undefined)//"unload" + viewId)
            };

        },

        matchRouteByPath: function (path, routes) {

            if (!routes) {
                routes = this.settings.routes;
            }

            var key, route, params, i,
                    paramValues = {},
                    search;

            //routes is an object so we can match the path to the route as it will be a property name.
            if (routes.hasOwnProperty(path)) {
                return routes[path];
            }

            for (key in routes) {

                if (routes.hasOwnProperty(key)) {

                    route = routes[key];

                    search = new RegExp('\\b' + route.path + '\\b', 'gi');

                    if (route.path !== "" &&
                        path.search(search) === 0) {

                        params = path.replace(route.path, "")
                                    .split("/")
                                    .slice(1); //the first item will be empty

                        for (i = 0; i < params.length; i++) {
                            paramValues[route.params[i]] = params[i];
                        }

                        route.paramValues = paramValues;

                        break;
                    }

                }

            }

            return route;
        },

        matchRouteById: function (id, routes) {

            if (!routes) {
                routes = this.settings.routes;
            }

            var route;

            for (route in routes) {
                if (routes[route].viewId === id) {
                    return routes[route];
                }
            }

            //for (var i = 0; i < routes.length; i++) {

            //    if (routes[i].viewId === id) {
            //        return route[i];
            //    }

            //}

        },

        //  newView: undefined, //placeholder for new view
        //  currentView: undefined, //placeholder for current view before a swap
        animation: undefined,

        getParameterByName: function (name) {

            name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");

            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
                results = regex.exec(location.search);

            return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
        },

        getVendorPropertyName: function (prop) {

            var prefixes = ['Moz', 'Webkit', 'O', 'ms'],
                vendorProp, i,
                prop_ = prop.charAt(0).toUpperCase() + prop.substr(1);

            if (prop in this.div.style) {
                return prop;
            }

            for (i = 0; i < prefixes.length; ++i) {

                vendorProp = prefixes[i] + prop_;

                if (vendorProp in this.div.style) {
                    return vendorProp;
                }

            }
        },

        transitionend: {
            'animation': 'animationend',
            'webkitAnimation': 'webkitAnimationEnd',
            'MozAnimation': 'animationend',
            'OAnimation': 'oAnimationEnd'
        },

        // repurposed helper
        cssPrefix: function (suffix) {

            if (!suffix) { return ''; }

            var i, len, parts, prefixes,
                bodyStyle = document.body.style;

            if (suffix.indexOf('-') >= 0) {

                parts = ('' + suffix).split('-');

                for (i = 1, len = parts.length; i < len; i++) {
                    parts[i] = parts[i].substr(0, 1).toUpperCase() + parts[i].substr(1);
                }
                suffix = parts.join('');
            }

            if (suffix in bodyStyle) {
                return suffix;
            }

            suffix = suffix.substr(0, 1).toUpperCase() + suffix.substr(1);

            prefixes = ['webkit', 'Moz', 'ms', 'O'];

            for (i = 0, len = prefixes.length; i < len; i++) {
                if (prefixes[i] + suffix in bodyStyle) {
                    return prefixes[i] + suffix;
                }
            }

            return "";
        },

        removeExtraViews: function (currentView) {

            while (currentView.length > 1) {
                currentView[currentView.length - 1]
                        .parentNode.removeChild(currentView[currentView.length - 1]);
            }
        },

        pushGA: function (path) {

            //if Google Analytics available, then push the path
            if (_gaq !== undefined) {
                _gaq.push(['_trackPageview', path]);
            }
        },

        swapView: function () {

            var that = this,
                route, oldRoute, anim,
                hash = window.location.hash, newView,
                hasEscapeFragment = that.getParameterByName("_escaped_fragment_"),
                hashFragment = (hash !== "#") ? hash.replace("#!", "") : "",
                path = hashFragment.split(":")[0],
                currentView = document.querySelectorAll("." + this.settings.currentClass);

            if (currentView.length) {
                //adding this because I found myself sometimes tapping items to launch a new view before the animation was complete.
                that.removeExtraViews(currentView);
            }

            //convert nodelist to a single node
            currentView = currentView[0];

            if (currentView && currentView.id) {
                oldRoute = that.matchRouteById(currentView.id);
            }

            route = that.matchRouteByPath(path);
            anim = that.getAnimation(route);
            that.animation = anim;

            if (route !== undefined) {

                that.pushGA(path);

                that.ensureViewAvailable(currentView, route.viewId);

                newView = document.getElementById(route.viewId);

                if (newView) {

                    if (currentView) {

                        if (that.hasAnimations() && anim) {

                            currentView.addEventListener(
                                that.transitionend[that.cssPrefix("animation")], function (e) {
                                    that.endSwapAnimation.call(that, currentView, newView, oldRoute);
                                });

                            //modify once addClass supports array of classes
                            $(currentView).addClass("animated out " + anim)
                                .removeClass("in");

                        } else {
                            that.endSwapAnimation.call(that, undefined, currentView, newView, oldRoute);
                        }

                    }

                    $(newView).addClass(that.settings.currentClass +
                                        " animated " + anim + " in");

                    that.setDocumentTitle(route);

                    if (route) {
                        that.makeCallback(route, "onload");
                    }

                }

            } else if (hasEscapeFragment === "") { //Goto 404 handler

                window.location.hash = "#!" + this.settings.NotFoundRoute;

            } else {//should only get here is this is an escapefragemented url for the spiders
                newView = $(this.settings.viewSelector).addClass(that.settings.currentClass);
            }

        },

        getAnimation: function (route) {

            if (!route) {
                return this.settings.viewTransition;
            }

            return this.animations[route.transition] || this.settings.viewTransition;

        },

        endSwapAnimation: function (currentView, newView, route) {

            var that = this,
                anim = that.animation;

            $(currentView).removeClass(that.settings.currentClass + " " +
                                        anim + " out ");

            $(newView).removeClass(anim + " in");

            if (currentView && that.bp && currentView.parentNode) {

                currentView.parentNode.removeChild(currentView);

            }

            if (route) {
                that.makeCallback(route, "unload");
            }

        },

        //make sure the view is actually available, this relies on backpack to supply the markup and inject it into the DOM
        ensureViewAvailable: function (currentView, newViewId) {
            //must have backpack or something similar that implements its interface
            if (this.bp) {

                var view = this.bp.getViewData(newViewId),
                    newView, loc;

                if (view) {
                    newView = this.createFragment(view.content);
                } else {
                    loc = window.location.href.split("#!");
                    window.location.replace(loc[0] + "?" +
                        this.settings.forceReload + "=" + loc[1]);
                }

                if (currentView) {
                    currentView.parentNode
                                .insertBefore(newView, currentView);
                } else {
                    document.querySelector(this.settings.mainWrappperSelector)
                                .appendChild(newView);
                }

            }
            //else assume the view is already in the markup

        },

        makeCallback: function (route, action) {

            var that = this,
                a, cbPaths, callback;

            if (action && !route[action]) {

                var ctx = that.settings.appContext;

                if (that.settings.appContext) {

                    if (ctx[route.viewId] && ctx[route.viewId][action]) {
                        ctx[route.viewId][action].call(ctx, route.paramValues || {});
                    }

                }


                return;
            }

            cbPaths = route[action].split(".");

            callback = window[cbPaths[0]];

            for (a = 1; a < cbPaths.length; a++) {

                if (a === 1) {
                    that = callback;
                }

                callback = callback[cbPaths[a]];
            }

            if (callback) {
                callback.call(that, route.paramValues || {});
            }

        },

        setDocumentTitle: function (route) {

            var title = route.title, i;

            if (title === "") {
                return;
            }

            for (i = 0; i < route.params.length; i++) {
                title = title.replace(":" +
                                    route.params[i],
                                    route.paramValues[route.params[i]]);
            }

            document.title = title;

        },

        createFragment: function (htmlStr) {

            var frag = document.createDocumentFragment(),
                temp = document.createElement("div");

            temp.innerHTML = htmlStr;

            while (temp.firstChild) {
                frag.appendChild(temp.firstChild);
            }

            return frag;
        },

        hasAnimations: function () {

            var animation = false,
                elm = document.createElement("div"),
                animationstring = 'animation',
                keyframeprefix = '',
                domPrefixes = 'Webkit Moz O ms Khtml'.split(' '),
                pfx = '', i = 0;

            if (elm.style.animationName) { animation = true; }

            if (animation === false) {
                for (i = 0; i < domPrefixes.length; i++) {
                    if (elm.style[domPrefixes[i] + 'AnimationName'] !== undefined) {
                        pfx = domPrefixes[i];
                        animationstring = pfx + 'Animation';
                        keyframeprefix = '-' + pfx.toLowerCase() + '-';
                        animation = true;
                        break;
                    }
                }
            }

            return animation;

        },

        storeAsyncContent: function (content) {

            this.bp.updateViewsFromFragment(this.settings.viewSelector, content);
        },

        loadAsyncContent: function (url, callback) {

            callback = callback || this.storeAsyncContent;

            var oReq = new XMLHttpRequest();

            oReq.onload = callback;
            oReq.open("get", url, true);
            oReq.send();
        },

        //array of animations. The names match the CSS class so make sure you have the CSS for this animation or you will be dissapointed.
        animations: {
            "slide": "slide",
            "fade": "fade",
            "flip": "flip"
        },

        settings: {
            routes: [],
            viewSelector: ".content-pane",
            currentClass: "current",
            mainWrappperSelector: "main",
            NotFoundView: "NotFound",
            NotFoundRoute: "404",
            defaultTitle: "A Single Page Site with Routes",
            titleSelector: ".view-title",
            forceReload: "_force_reload_",
            autoSetTitle: true,
            parseDOM: true,
            initView: true,
            viewTransition: "slide",
            asyncUrl: undefined
        }

    };

    // Give the init function the spa prototype for later instantiation
    spa.fn.init.prototype = spa.fn;

    return (window.spa = spa);

})(window);
