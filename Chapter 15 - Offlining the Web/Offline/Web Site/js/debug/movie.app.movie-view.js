﻿
(function (window, undefined) {

    "use strict";

    movieApp.fn.loadMovieView = function (params) {

        if (!params || !params.id) {
            this.showError("No Movie Id Requested");
        }

        var that = this;
        
        that.loadMovieDetails(params.id, function (data) {

            if (!data) {
                return;
            }

            that.renderMovieDetails(data);

        });
        
    };
    
    movieApp.fn.renderMovieDetails = function (data) {

        if (data) {

            var that = this;

            that.mergeData(".movie-details-panel", "movieDetailsPosterTemplate", data);
            that.mergeData(".movie-description", "movieDetailsDescriptionTemplate", data);
            that.mergeData(".cast-name-list", "movieDetailsCastTemplate", data);
            that.mergeData(".movie-showtime-list", "MovieShowtimeTemplate",
                            that.mergeInFakeShowtimes(data));

            that.setupPanorama(".panorama-container", { maxWidth: 610 });
            that.setMainTitle(data.title);
            
            that.bindPanelTitles();

            that.manageMovieView();
            
            that.resizeEvents["manageMovieView"] = that.manageMovieView;
        }

    };

    movieApp.fn.bindPanelTitles = function () {

        var showTimes = document.querySelector(".movie-showtime-list"),
            castNames = document.querySelector(".cast-name-list"),
            movieDesc = document.querySelector(".movie-description"),
            showTimesTitle = document.querySelector(".movie-showtimes-panel > .panel-title"),
            castNamesTitle = document.querySelector(".movie-cast-panel > .panel-title"),
            movieDescTitle = document.querySelector(".movie-description-panel > .panel-title"),
            showReview = document.getElementById("showReview");

        movieDesc.show();

        deeptissue(".movie-description-panel > .panel-title").tap(function (e) {

            var width = window.innerWidth;

            if (width > 600 && width < 820) {

                showTimes.hide();
                showReview.hide();
                castNames.hide();
                movieDesc.show();

                showTimesTitle.removeClass("selected");
                castNamesTitle.removeClass("selected");
                movieDescTitle.addClass("selected");

            }

        });

        deeptissue(".movie-cast-panel > .panel-title").tap(function (e) {

            var width = window.innerWidth;

            if (width > 600 && width < 820) {

                showTimes.hide();
                showReview.hide();
                castNames.show();
                movieDesc.hide();

                castNames.style.position = "relative";
                castNames.style.left = "-130px";

                showTimesTitle.removeClass("selected");
                castNamesTitle.addClass("selected");
                movieDescTitle.removeClass("selected");

            }

        });

        deeptissue(".movie-showtimes-panel > .panel-title").tap(function (e) {

            var width = window.innerWidth;

            if (width > 600 && width < 820) {

                showTimes.show();
                showReview.show();
                castNames.hide();
                movieDesc.hide();

                showTimes.style.position = "relative";
                showTimes.style.left = "-260px";

                showReview.style.position = "relative";
                showReview.style.left = "-200px";
                showReview.style.top = "30px";

                showTimesTitle.addClass("selected");
                castNamesTitle.removeClass("selected");
                movieDescTitle.removeClass("selected");

            }

        });

        deeptissue(showReview).tap(function (e) {

            document.querySelector(".movie-review-panel").show();

        });

    };

    movieApp.fn.unloadMovieView = function () {

        delete this.resizeEvents["manageMovieView"];

    };

    movieApp.fn.manageMovieView = function () {

        var width = window.innerWidth;

        if (width < 600 && width > 820) {
        
            var showTimes = document.querySelector(".movie-showtime-list"),
                castNames = document.querySelector(".cast-name-list");
            
            showTimes.style.position = "";
            showTimes.style.left = "";

            showReview.style.position = "";
            showReview.style.left = "";
            showReview.style.top = "";

        }

    };

    movieApp.fn.clearInlineRelativePostition = function (nodes) {

        if (!nodes.legth) {
            nodes = [nodes];
        }

        for (var i = 0; i < nodes.length; i++) {

            nodes[i].style.position = "";
            nodes[i].style.left = "";

        }

    };

}(window));