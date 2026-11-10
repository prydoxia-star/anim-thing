
/*
=========================================================
SWIFTSPARROW — SYNCHRONISED MOTORCYCLE + ZIPPER
=========================================================

1. Motorcycle travels from left to right.
2. Dots appear behind the motorcycle.
3. Every dot triggers its matching panel pair.
4. Upper panel moves upwards.
5. Lower panel moves downwards.
6. Each pair opens in sync with its corresponding dot.
7. Each dot fades individually after 3 seconds.
8. Website is revealed underneath.
9. Intro is removed after all animations finish.

=========================================================
*/


(() => {

    "use strict";


    /* =====================================================
       1. SETTINGS
       CHANGE ANIMATION VALUES HERE
    ===================================================== */

    const SETTINGS = {

        /* MOTORCYCLE */

        bikeSpeed: 0.78,

        bikeVisibleLeft: 97 / 1024,
        bikeVisibleRight: 844 / 1024,


        /* DOTS */

        dotSize: 20,

        dotGap: 10,

        dotTrailGap: 20,

        dotPulseDuration: 240,

        dotFadeDelay: 200,

        dotFadeDuration: 550,


        /* ZIPPER */

        panelDuration: 1050,


        /* CLEANUP */

        cleanupDelay: 100

    };


    /* =====================================================
       2. ELEMENTS
    ===================================================== */

    const root = document.documentElement;

    let overlay;
    let site;
    let panels;
    let dotTrack;
    let bike;


    /* =====================================================
       3. STATE
    ===================================================== */

    let panelPairs = [];

    let lastDotFadeEndTime = 0;

    let lastPanelEndTime = 0;

    let websiteRevealed = false;

    let animationStarted = false;


    /* =====================================================
       4. UTILITIES
    ===================================================== */

    function clamp(value, min, max) {

        return Math.max(min, Math.min(max, value));

    }


    function lerp(start, end, progress) {

        return start + (end - start) * progress;

    }


    function wait(milliseconds) {

        return new Promise(resolve => {

            window.setTimeout(
                resolve,
                Math.max(0, milliseconds)
            );

        });

    }


    function waitUntil(timestamp) {

        return wait(timestamp - performance.now());

    }


    function nextFrame() {

        return new Promise(resolve => {

            requestAnimationFrame(resolve);

        });

    }


    /* =====================================================
       5. REVEAL WEBSITE
    ===================================================== */

    function revealWebsite() {

        if (site) {

            site.inert = false;

            site.classList.add("is-revealed");

        }

        root.classList.remove("has-intro");

        if (overlay) {

            overlay.remove();

        }

    }


    /* =====================================================
       6. APPLY CSS SETTINGS
    ===================================================== */

    function applySettings() {

        dotTrack.style.setProperty(
            "--dot-size",
            `${SETTINGS.dotSize}px`
        );

        dotTrack.style.setProperty(
            "--dot-pulse-duration",
            `${SETTINGS.dotPulseDuration}ms`
        );

        dotTrack.style.setProperty(
            "--dot-fade-duration",
            `${SETTINGS.dotFadeDuration}ms`
        );

        panels.style.setProperty(
            "--panel-duration",
            `${SETTINGS.panelDuration}ms`
        );

    }


    /* =====================================================
       7. LOAD MOTORCYCLE
    ===================================================== */

    function waitForBike() {

        return new Promise(resolve => {

            if (bike.complete) {

                resolve(bike.naturalWidth > 0);

                return;

            }

            bike.addEventListener(
                "load",
                () => resolve(true),
                { once: true }
            );

            bike.addEventListener(
                "error",
                () => resolve(false),
                { once: true }
            );

        });

    }


    /* =====================================================
       8. CALCULATE DOT POSITIONS
    ===================================================== */

    function calculateDotLayout(viewportWidth) {

        const radius = SETTINGS.dotSize / 2;

        const spacing =
            SETTINGS.dotSize + SETTINGS.dotGap;

        const firstPosition = radius;

        const lastPosition =
            viewportWidth - radius;

        const count = Math.max(

            1,

            Math.floor(
                (lastPosition - firstPosition) / spacing
            ) + 1

        );


        return {

            radius,

            spacing,

            firstPosition,

            count

        };

    }


    /* =====================================================
       9. CREATE MATCHING ZIPPER PANELS
    ===================================================== */

    function createPanels(dotCount, viewportWidth) {

        panels.replaceChildren();

        panelPairs = [];

        const fragment =
            document.createDocumentFragment();


        /*
           One panel pair for every dot.

           This ensures that every dot has
           a matching upper and lower section.
        */

        const panelWidth = 100 / dotCount;


        for (let index = 0; index < dotCount; index++) {

            const left = index * panelWidth;


            /* UPPER PANEL */

            const top = document.createElement("div");

            top.className =
                "zipper-strip zipper-strip-top";

            top.style.left = `${left}%`;

            top.style.width =
                `calc(${panelWidth}% + 1px)`;


            /* LOWER PANEL */

            const bottom = document.createElement("div");

            bottom.className =
                "zipper-strip zipper-strip-bottom";

            bottom.style.left = `${left}%`;

            bottom.style.width =
                `calc(${panelWidth}% + 1px)`;


            fragment.appendChild(top);

            fragment.appendChild(bottom);


            /*
               Store both elements together.

               The dot at this index opens this pair.
            */

            panelPairs.push({

                top,

                bottom

            });

        }


        panels.appendChild(fragment);

    }


    /* =====================================================
       10. REVEAL WEBSITE UNDER PANELS
    ===================================================== */

    function revealWebsiteUnderPanels() {

        if (websiteRevealed) {

            return;

        }

        websiteRevealed = true;

        site.inert = false;

        site.classList.add("is-revealed");

    }


    /* =====================================================
       11. OPEN MATCHING PANEL
    ===================================================== */

    function openMatchingPanel(index) {

        const pair = panelPairs[index];

        if (!pair) {

            return;

        }


        /*
           Open exactly the panel pair corresponding
           to the newly created dot.
        */

        const openingTime = performance.now();

        pair.top.classList.add("is-open");

        pair.bottom.classList.add("is-open");


        lastPanelEndTime = Math.max(

            lastPanelEndTime,

            openingTime + SETTINGS.panelDuration

        );

    }


    /* =====================================================
       12. CREATE DOT AND OPEN MATCHING PANEL
    ===================================================== */

    function createDot(position, index) {

        const dot = document.createElement("span");

        dot.className = "zip-dot";

        dot.setAttribute("aria-hidden", "true");

        dot.style.left = `${position}px`;


        /*
           Add the dot to the trail.
        */

        dotTrack.appendChild(dot);


        /*
           Reveal website underneath the panels
           when the first dot appears.
        */

        revealWebsiteUnderPanels();


        /*
           IMPORTANT:

           Each dot opens the panel pair with
           the same index.
        */

        openMatchingPanel(index);


        /*
           Start this dot's independent fade timer.
        */

        const birthTime = performance.now();

        const fadeEndTime =

            birthTime +

            SETTINGS.dotFadeDelay +

            SETTINGS.dotFadeDuration;


        lastDotFadeEndTime = Math.max(

            lastDotFadeEndTime,

            fadeEndTime

        );


        window.setTimeout(() => {

            dot.classList.add("is-fading");


            window.setTimeout(() => {

                dot.remove();

            }, SETTINGS.dotFadeDuration + 30);

        }, SETTINGS.dotFadeDelay);

    }


    /* =====================================================
       13. MOTORCYCLE MOVEMENT
    ===================================================== */

    function animateMotorcycle() {

        return new Promise(resolve => {

            const viewportWidth = window.innerWidth;

            const bikeWidth =
                bike.getBoundingClientRect().width;


            /* Visible image boundaries */

            const visibleLeftOffset =

                (
                    SETTINGS.bikeVisibleLeft - 0.5
                ) * bikeWidth;


            const visibleRightOffset =

                (
                    SETTINGS.bikeVisibleRight - 0.5
                ) * bikeWidth;


            /* Start outside left edge */

            const startX =
                -visibleRightOffset - 24;


            /* Finish outside right edge */

            const endX =

                viewportWidth -

                visibleLeftOffset +

                24;


            const distance = endX - startX;

            const duration =
                distance / SETTINGS.bikeSpeed;

            const startTime = performance.now();


            bike.style.left = `${startX}px`;


            const dotLayout =
                calculateDotLayout(viewportWidth);


            let nextDotIndex = 0;


            /* =============================================
               ANIMATION FRAME
            ============================================= */

            function frame(now) {

                const elapsed = now - startTime;

                const progress = clamp(

                    elapsed / duration,

                    0,

                    1

                );


                /* Move motorcycle */

                const currentX = lerp(

                    startX,

                    endX,

                    progress

                );

                bike.style.left = `${currentX}px`;


                /*
                   Calculate visible trailing edge.

                   This ensures the dots are left behind
                   after the motorcycle passes.
                */

                const trailingEdge =

                    currentX +

                    visibleLeftOffset;


                /*
                   Emit dots and open matching panels
                   in exactly the same sequence.
                */

                while (nextDotIndex < dotLayout.count) {

                    const dotPosition =

                        dotLayout.firstPosition +

                        nextDotIndex * dotLayout.spacing;


                    const emissionPosition =

                        dotPosition +

                        dotLayout.radius +

                        SETTINGS.dotTrailGap;


                    if (trailingEdge < emissionPosition) {

                        break;

                    }


                    /*
                       Dot index and panel index are identical.
                    */

                    createDot(

                        dotPosition,

                        nextDotIndex

                    );

                    nextDotIndex++;

                }


                /* Continue motorcycle travel */

                if (progress < 1) {

                    requestAnimationFrame(frame);

                    return;

                }


                /* Fully exit screen */

                bike.style.left = `${endX}px`;

                resolve();

            }


            requestAnimationFrame(frame);

        });

    }


    /* =====================================================
       14. WAIT FOR DOTS AND PANELS
    ===================================================== */

    async function finishAnimation() {


        /*
           If the animation somehow produces no dots,
           open all panels to prevent a stuck screen.
        */

        if (!websiteRevealed) {

            revealWebsiteUnderPanels();

            panelPairs.forEach((pair, index) => {

                openMatchingPanel(index);

            });

        }


        /*
           Both animations share the same timeline.

           Wait until the last dot has faded and
           the final panel has finished opening.
        */

        await Promise.all([

            waitUntil(lastDotFadeEndTime),

            waitUntil(lastPanelEndTime)

        ]);


        await wait(SETTINGS.cleanupDelay);


        /* Remove intro */

        overlay.remove();

        root.classList.remove("has-intro");

    }


    /* =====================================================
       15. INITIALISE
    ===================================================== */

    async function initialise() {

        if (animationStarted) {

            return;

        }

        animationStarted = true;


        overlay = document.getElementById("intro-overlay");

        site = document.getElementById("site-preview");

        panels = document.getElementById("zipper-panels");

        dotTrack = document.getElementById("zipper-dots");

        bike = document.getElementById("zipper-bike");


        /* Validate HTML elements */

        if (
            !overlay ||
            !site ||
            !panels ||
            !dotTrack ||
            !bike
        ) {

            console.error(
                "SwiftSparrow: Required animation elements are missing."
            );

            revealWebsite();

            return;

        }


        /* Reduced motion support */

        if (
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches
        ) {

            revealWebsite();

            return;

        }


        site.inert = true;


        try {

            applySettings();


            /* Wait for motorcycle image */

            const imageLoaded = await waitForBike();

            if (!imageLoaded) {

                throw new Error(
                    "Motorcycle image failed to load. Check assets/Motorcycle-no-bg.png."
                );

            }


            /*
               Create corresponding panels before movement.

               Number of panel pairs = number of dots.
            */

            const viewportWidth = window.innerWidth;

            const layout =
                calculateDotLayout(viewportWidth);

            createPanels(
                layout.count,
                viewportWidth
            );


            /*
               Register the closed panel positions
               before the first dot triggers movement.
            */

            void panels.offsetHeight;

            await nextFrame();

            await nextFrame();


            /* Start motorcycle */

            await animateMotorcycle();


            /* Wait for final dot and panel */

            await finishAnimation();

        }

        catch (error) {

            console.error(
                "SwiftSparrow animation error:",
                error
            );

            revealWebsite();

        }

    }


    /* =====================================================
       16. START
    ===================================================== */

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            initialise,
            { once: true }
        );

    } else {

        initialise();

    }


})();
