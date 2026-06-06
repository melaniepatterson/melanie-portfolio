/*
 * File       : js/motion.js
 * Author     : STUDIO-JT (Chaehee)
 *
 * SUMMARY:
 *
 */



(function(){
    
    if ( !document.body.classList.contains('home') ) return; 
    paper.install(window);
    
    const CANVAS = document.getElementById("canvas");
    let leftSide = document.querySelector(".main-brandstory__nav--prev");
    let rightSide = document.querySelector(".main-brandstory__nav--next");
    let swiperWrapper = document.querySelector(".main-brandstory__slider .swiper-wrapper");
    
    paper.setup(CANVAS);
    
    let HOVER_DURATION = 1800;
    let CLICK_DURATION = 1500;
    let HOVER_RATIO = 10;
    let CLICK_RATIO = 100;
    let CLICK_SHAPE = ( JT.browser('android') && JT.browser('mobile') ) ? 0.015 : 0.024;
    let POINTS = 3;
    let IS_DESTROY = false;
    let HOVER_P = 0;
    
    let IS_MOBILE;
    
    const imageElements = document.querySelectorAll('.main-brandstory__slider-item img');
    const IMAGE_LIST = [];
    
    imageElements.forEach(function(imageElement){
        IMAGE_LIST.push(imageElement.getAttribute('src'));
    })
    
    /* controller (필요 시 주석 해제 - 삭제 금지) */
    /*
    const settings = {
        hover_duration: HOVER_DURATION,
        click_duration: CLICK_DURATION,
        hover_size: HOVER_RATIO,
        click_size: CLICK_RATIO,
        click_shape: CLICK_SHAPE,
        points: POINTS,
        is_destroy: IS_DESTROY,
        is_mag: false,
    };
    
    const gui = new dat.GUI();
    const f0 = gui.addFolder("Size");
    f0.add(settings, "hover_size", 0, 50)
        .step(1)
        .name("hover_size")
        .onChange(() => {
            HOVER_RATIO = settings.hover_size;
        });
    f0.add(settings, "click_size", 100, 200)
        .step(1)
        .name("click_size")
        .onChange(() => {
            CLICK_RATIO = settings.click_size;
        });
    const f1 = gui.addFolder("Duration");
    f1.add(settings, "hover_duration", 0, 3000)
        .step(10)
        .name("hover_duration")
        .onChange(() => {
            HOVER_DURATION = settings.hover_duration;
        });
    f1.add(settings, "click_duration", 0, 3000)
        .step(10)
        .name("click_duration")
        .onChange(() => {
            CLICK_DURATION = settings.click_duration;
        });
    const f2 = gui.addFolder("Shape");
    f2.add(settings, "click_shape", 0, 0.1)
        .step(0.001)
        .name("click_shape")
        .onChange(() => {
            CLICK_SHAPE = settings.click_shape;
        });
    const f3 = gui.addFolder("ETC");
    f3.add(settings, "is_destroy")
        .name("destroy / init")
        .onChange(() => {
            IS_DESTROY = !settings.is_destroy;
    
            if (IS_DESTROY) {
                init();
            } else {
                destroy();
            }
        });
    
    f0.open();
    f1.open();
    f2.open();
    f3.open();
    */
    
    let COUNT = 0;
    let CLICK_P = 0;
    
    let prevPath, nextPath;
    let prevRaster, nextRaster;
    let prevGroup, nextGroup;
    let lc = 0;
    let rc = 0;
    let animation;
    let animRef;
    let index = 0;
    let swiper;
    let cursor = {
        x: 0,
        y: 0,
    };
    let lastY = 0;
    
    const onLeavePrev = () => {
        HOVER_P = 0;
        if (CLICK_P) return;
      
        const tempLc = lc;
      
        animation = anime({
            targets: "prev",
            duration: HOVER_DURATION,
            update: (anim) => {
                lc = Math.max(
                    tempLc - easeOutCubic(anim.progress / 100) * HOVER_RATIO,
                    0
                );
            },
        });
    };
    
    const onHoverPrev = () => {
        HOVER_P = -1;
        if (CLICK_P) return;
      
        const tempLc = lc;
      
        animation = anime({
            targets: "prev",
            duration: HOVER_DURATION,
            update: (anim) => {
                lc = Math.min(
                    tempLc + easeOutCubic(anim.progress / 100) * HOVER_RATIO,
                    HOVER_RATIO
                );
            },
        });
    };
    
    const onLeaveNext = () => {
        HOVER_P = 0;
        if (CLICK_P) return;
      
        const tempRc = rc;
      
        animation = anime({
            targets: "next",
            duration: HOVER_DURATION,
            update: (anim) => {
                rc = Math.max(
                    tempRc - easeOutCubic(anim.progress / 100) * HOVER_RATIO,
                    0
                );
            },
        });
    };
    
    const onHoverNext = () => {
        HOVER_P = 1;
        if (CLICK_P) return;
    
        const tempRc = rc;
    
        animation = anime({
            targets: "next",
            duration: HOVER_DURATION,
            update: (anim) => {
                rc = Math.min(
                    tempRc + easeOutCubic(anim.progress / 100) * HOVER_RATIO,
                    HOVER_RATIO
                );
            },
        });
    };
    
    const onClickPrev = () => {
        if (IS_DESTROY) return;
        if (!prevRaster.loaded) return;
        if (index === 0) return;
        if (CLICK_P !== 0) return;
      
        CLICK_P = -1;
        const tempLc = lc;
        lastY = cursor.y;
        
        animation = anime({
            targets: "prev",
            duration: IS_MOBILE ? (CLICK_DURATION * 2) / 3 : CLICK_DURATION,
            update: (anim) => {
                lc = tempLc + (anim.progress / 100) * CLICK_RATIO;
                prevRaster.fitBounds(
                    new Rectangle(
                        -view.size.width * 0.1 * (1 - anim.progress / 100),
                        -view.size.height * 0.1 * (1 - anim.progress / 100),
                        view.size.width * (1 + 0.2 * (1 - anim.progress / 100)),
                        view.size.height * (1 + 0.2 * (1 - anim.progress / 100))
                    ),
                    true
                );
            },
            changeBegin: function () {
                document.querySelectorAll('.main-brandstory__nav').forEach((nav) => {nav.classList.add('disable')})
                if ( JT.browser('mobile')){ swiperWrapper.classList.add('disable'); }
    
                if (index === IMAGE_LIST.length - 1) {
                    lastSlideTextPrevAni();
                }else{
                    rollDown();
                }
                index = swiper.activeIndex;
                document.querySelector('.custom-cursor__current').innerText = index;
            },
            complete: async () => {
                swiper.slidePrev();
                index = swiper.activeIndex;
                document.querySelectorAll('.main-brandstory__nav').forEach((nav) => {nav.classList.remove('disable')})
                if ( JT.browser('mobile')){ swiperWrapper.classList.remove('disable'); }
            },
        }).finished.then(() => {
            lc = 0;
    
            setTimeout(() => {
                setRasterSrc();
    
                CLICK_P = 0;
    
                if (HOVER_P === -1) {
                    onHoverPrev();
                } else if (HOVER_P === 1) {
                    onHoverNext();
                }
            }, 50);
        });
    };
      
    const onClickNext = () => {
        if (IS_DESTROY) return;
        if (!nextRaster.loaded) return;
        if (index === IMAGE_LIST.length - 1) return;
        if (CLICK_P !== 0) return;
      
        CLICK_P = 1;
        const tempRc = rc;
        lastY = cursor.y;
        rollUp();
        animation = anime({
            targets: "next",
            duration: IS_MOBILE ? (CLICK_DURATION * 2) / 3 : CLICK_DURATION,
            update: (anim) => {
                rc = tempRc + (anim.progress / 100) * CLICK_RATIO;
                nextRaster.fitBounds(
                    new Rectangle(
                        -view.size.width * 0.1 * (1 - anim.progress / 100),
                        -view.size.height * 0.1 * (1 - anim.progress / 100),
                        view.size.width * (1 + 0.2 * (1 - anim.progress / 100)),
                        view.size.height * (1 + 0.2 * (1 - anim.progress / 100))
                    ),
                    true
                );
            },
            changeBegin: () => {
                document.querySelectorAll('.main-brandstory__nav').forEach((nav) => {nav.classList.add('disable')})
                if ( JT.browser('mobile')){ swiperWrapper.classList.add('disable'); }
                index = swiper.activeIndex;
                document.querySelector('.custom-cursor__current').innerText = index + 2;
            },
            complete: () => {
                swiper.slideNext();
                index = swiper.activeIndex;
                if (index === IMAGE_LIST.length - 1) {
                    lastSlideTextNextAni();
                }else{
                    document.querySelectorAll('.main-brandstory__nav').forEach((nav) => {nav.classList.remove('disable')})
                    if ( JT.browser('mobile')){ swiperWrapper.classList.remove('disable'); }
                }
            },
        }).finished.then(() => {
            rc = 0;
    
            setTimeout(() => {
                setRasterSrc();
    
                CLICK_P = 0;
    
                if (HOVER_P === -1) {
                    onHoverPrev();
                } else if (HOVER_P === 1) {
                    onHoverNext();
                }
            }, 50);
        });
    };
      
    const onTouchstart = (event) => {
        lastX = event.changedTouches[0].clientX;
    };
      
    const onTouchend = (event) => {
        const deltaX = lastX - event.changedTouches[0].clientX;
      
        if (Math.abs(deltaX) < 30) return;
      
        if (deltaX > 0) onClickNext();
        if (deltaX < 0) onClickPrev();
    };
      
    const setRasterSrc = () => {
        if (prevRaster) {
            prevRaster.source = IMAGE_LIST[index - 1] || null;
        }
        if (nextRaster) {
            nextRaster.source = IMAGE_LIST[index + 1] || null;
        }
    };
    
    const drawPath = () => {
        prevPath = new Path({
            fillColor: "black",
            clipMask: true,
        });
      
        prevPath.segments = [];
        prevPath.add(view.bounds.topLeft);
        prevPath.segments[0].point.y = -20;
        for (let i = 1; i < POINTS; i++) {
            let point = new Point(0, view.size.height * ((POINTS - 1) / POINTS) * i);
            prevPath.add(point);
        }
        prevPath.add(view.bounds.bottomLeft);
        prevPath.segments[POINTS].point.y = view.size.height + 20;
      
        nextPath = new Path({
            fillColor: "black",
            clipMask: true,
        });
      
        nextPath.segments = [];
        nextPath.add(view.bounds.topRight);
        nextPath.segments[0].point.y = -20;
        for (let i = 1; i < POINTS; i++) {
            let point = new Point(
                view.size.width,
                view.size.height * ((POINTS - 1) / POINTS) * i
            );
            nextPath.add(point);
        }
        nextPath.add(view.bounds.bottomRight);
        nextPath.segments[POINTS].point.y = view.size.height + 20;
      
        setRasterSrc();
      
        prevGroup = new Group([prevPath, prevRaster]);
        nextGroup = new Group([nextPath, nextRaster]);
    };
      
    const init = () => {
    
        IS_DESTROY = false;
        IS_MOBILE = JT.browser('mobile');
        if (swiper) swiper.destroy(true, false);
      
        swiper = new Swiper(".main-brandstory__slider", {
            navigation: {
                prevEl: null,
                nextEl: null,
            },
            pagination: {
                el: ".main-brandstory .swiper-pagination",
            },
            simulateTouch: true,
            speed: 0,
            initialSlide: index,
            touchRatio: 0,
            on: {
                init : function (){
                    const pagingHtml = '<span class="custom-cursor__fraction">' +
                                            '<i class="jt-icon icon-prev">' +
                                                '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="10" viewBox="0 0 14 10">' +
                                                    '<path d="M5.3,9.7L0.6,5l4.7-4.7l1.4,1.4L3.4,5l3.3,3.3L5.3,9.7z"/>' +
                                                    '<path d="M14,6H2V4h12V6z"/>' +
                                                '</svg>'+
                                            '</i>' +
                                            '<span class="custom-cursor__num">'+
                                                '<span class="custom-cursor__current jt-typo--15">1</span>' +
                                                '<span class="custom-cursor__slug jt-typo--15">/</span>' +
                                                '<span class="custom-cursor__total jt-typo--15">' + document.querySelectorAll('.main-brandstory__slider-item').length + '</span>' +
                                            '</span>'+
                                            '<i class="jt-icon icon-next">' +
                                                '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="10" viewBox="0 0 14 10">' +
                                                    '<path d="M8.7,9.7L7.3,8.3L10.6,5L7.3,1.7l1.4-1.4L13.4,5L8.7,9.7z"/>' +
                                                    '<path d="M12,6H0V4h12V6z"/>' +
                                                '</svg>' +
                                            '</i>' +
                                        '</span>';
                    document.querySelector('.custom-hover-text').innerHTML = pagingHtml;
                }
            }
        });
    
        swiper.on("slideChange", function () {
            index = swiper.activeIndex;
            if (index === 0){
                document
                    .querySelector(".main-brandstory__nav--prev")
                    .classList.add("hide");
                if ( !document.querySelector('.main-brandstory__slider').classList.contains('main-brandstory__slider--first') ){
                    document.querySelector('.main-brandstory__slider').classList.add('main-brandstory__slider--first');
                }
            }else {
                if ( document.querySelector('.main-brandstory__slider').classList.contains('main-brandstory__slider--first') ){
                    document.querySelector('.main-brandstory__slider').classList.remove('main-brandstory__slider--first');
                }
            }
    
            if (index === IMAGE_LIST.length - 1){
                document
                    .querySelector(".main-brandstory__nav--next")
                    .classList.add("hide");
                if ( document.querySelector('.main-brandstory__slider').classList.contains('main-brandstory__slider--first') ){
                    document.querySelector('.main-brandstory__slider').classList.remove('main-brandstory__slider--first');
                }
            }
        });
      
        prevRaster = new Raster();
        prevRaster.on("load", () => {
            prevRaster.position = view.center;
            prevRaster.fitBounds(view.bounds, true);
            prevRaster.fitBounds(
            new Rectangle(
                -view.size.width * 0.1,
                -view.size.height * 0.1,
                view.size.width * 1.2,
                view.size.height * 1.2
            ),
            true
          );
        });
        nextRaster = new Raster();
        nextRaster.on("load", () => {
            nextRaster.position = view.center;
            nextRaster.fitBounds(view.bounds, true);
            nextRaster.fitBounds(
            new Rectangle(
                -view.size.width * 0.1,
                -view.size.height * 0.1,
                view.size.width * 1.2,
                view.size.height * 1.2
            ),
            true
            );
        });
        drawPath();
      
        leftSide.addEventListener("click", onClickPrev);
        leftSide.addEventListener("mouseover", onHoverPrev);
        leftSide.addEventListener("mouseleave", onLeavePrev);
      
        rightSide.addEventListener("click", onClickNext);
        rightSide.addEventListener("mouseover", onHoverNext);
        rightSide.addEventListener("mouseleave", onLeaveNext);
      
        swiperWrapper.addEventListener("touchstart", onTouchstart);
        swiperWrapper.addEventListener("touchend", onTouchend);
        swiperWrapper.classList.add("swiper-wrapper-delay");
      
        onFrame();
    };
    
    let sideWidth = view.size.width * 0.3;
    
    const onFrame = () => {
        COUNT += 1;
      
        // Prev
        prevPath.segments[0].point.y = -20 - lc * 10;
        prevPath.segments[POINTS].point.y = view.size.height + 20 + lc * 10;
        for (let i = 1; i < POINTS; i++) {
            let sinSeed = COUNT + (i + (i % 10)) * 100;
    
            let sinW = lc <= 10 ? lc * 10 : 100;
            let sinHeight = Math.sin(sinSeed / 200) * sinW;
    
            let th = (lc * view.size.width) / (IS_MOBILE ? 70 : 100);
    
            prevPath.segments[i].point.x = Math.sin(sinSeed / 100) * sinHeight + th;
      
            if (CLICK_P) {
                prevPath.segments[i].point.y =
                    prevPath.segments[i].point.y +
                    (prevPath.segments[i].point.y - view.center.y) * CLICK_SHAPE;
            } else {
                prevPath.segments[i].point.y = (view.size.height / POINTS) * i;
            }
        }
        prevPath.smooth({ type: "continuous" });
      
        // Next
        nextPath.segments[0].point.y = -20 - rc * 10;
        nextPath.segments[POINTS].point.y = view.size.height + 20 + rc * 10;
        for (let i = 1; i < POINTS; i++) {
            let sinSeed = COUNT + (i + (i % 10)) * 100;
    
            let sinW = rc <= 10 ? rc * 10 : 100;
            let sinHeight = Math.sin(sinSeed / 200) * sinW;
    
            let th = (rc * view.size.width) / (IS_MOBILE ? 70 : 100);
    
            nextPath.segments[i].point.x =
            Math.sin(sinSeed / 100) * sinHeight + view.size.width - th;
    
            if (CLICK_P) {
                nextPath.segments[i].point.y =
                    nextPath.segments[i].point.y +
                    (nextPath.segments[i].point.y - view.center.y) * CLICK_SHAPE;
            } else {
                nextPath.segments[i].point.y = (view.size.height / POINTS) * i;
            }
        }
        nextPath.smooth({ type: "continuous" });
      
        animRef = requestAnimationFrame(onFrame);
    };
    
    const resize = (event) => {
        if (IS_DESTROY) return;
        IS_MOBILE = JT.browser('mobile');
      
        view.update();
      
        prevPath.remove();
        nextPath.remove();
        prevGroup.remove();
        nextGroup.remove();
      
        prevPath = null;
        nextPath = null;
        prevGroup = null;
        nextGroup = null;
      
        drawPath();
    };
    
    const handleMousemove = (event) => {
        const { clientX, clientY } = event;
        cursor = { x: clientX, y: clientY };
      
        if (clientX < window.innerWidth * 0.5 && index !== 0) {
            document.querySelector(".main-brandstory__nav--prev").classList.remove("hide");
        } else if ( clientX > window.innerWidth * 0.5 && index !== IMAGE_LIST.length - 1 ) {
            document.querySelector(".main-brandstory__nav--next").classList.remove("hide");
        } else if (clientX < window.innerWidth * 0.5 && index == 0){
            document.querySelector(".main-brandstory__nav--prev").classList.add("hide");
        } else {
            document.querySelector(".main-brandstory__nav--prev").classList.add("hide");
            document.querySelector(".main-brandstory__nav--next").classList.add("hide");
        }
    };
    
    let lastX = 0;
    let translateY = 0;
    let textIndex = 0;
    
    const subtitles = document.querySelectorAll('.main-brandstory__desc');
    
    const SUBTITLE_ARR = [];;
    
    subtitles.forEach(function(subtitle){
        SUBTITLE_ARR.push(subtitle);
    })
    
    function rollUp() {
        translateY -= 100;
        textIndex += 1;
        //handleTextVisible();
        const box = document.querySelector(".main-brandstory__keyword");
        box.style.transform = `translateY(${translateY}%)`;
    
        gsap.to(SUBTITLE_ARR[textIndex - 1], .6, { autoAlpha: 0 });
        gsap.to(SUBTITLE_ARR[textIndex], .6, { autoAlpha: 1 });
    }
    
    function rollDown() {
        translateY += 100;
        textIndex -= 1;
        //handleTextVisible();
        const box = document.querySelector(".main-brandstory__keyword");
        box.style.transform = `translateY(${translateY}%)`;
    
        gsap.to(SUBTITLE_ARR[textIndex], .6, { autoAlpha: 1 });
        gsap.to(SUBTITLE_ARR[textIndex + 1], .6, { autoAlpha: 0 });
    }
    
    function lastSlideTextNextAni() {
        const elLast = document.querySelector('.main-brandstory__last');
        const elDesc = document.querySelector('.main-brandstory__desc-wrap');
        const elTitle = document.querySelector('.main-brandstory__title');
    
        const lastHeight = elLast.clientHeight;
        const descHeight = elDesc.clientHeight;
        const moveHeight = lastHeight - descHeight;
    
        const move = moveHeight - (elTitle.clientHeight + lastHeight )/2
    
        gsap.to('.main-brandstory__desc-wrap', .6, { autoAlpha: 0, onStart: () => {
                document.querySelectorAll('.main-brandstory__nav').forEach((nav) => {nav.classList.add('disable')})
                if ( JT.browser('mobile')){ swiperWrapper.classList.add('disable'); }
                document.querySelector('.main-brandstory__slider').classList.add('main-brandstory__slider--last');
                document.querySelector('.main-brandstory__content').classList.add('main-brandstory__content--last');
                document.querySelector('.main-brandstory__content').style.bottom = 'calc(50% + ' + move + 'px)';
            } 
        });
        gsap.to('.main-brandstory__last', .6, { autoAlpha: 1, delay: .6, onComplete: function (){
            document.querySelectorAll('.main-brandstory__nav').forEach((nav) => {nav.classList.remove('disable')})
            if ( JT.browser('mobile')){ swiperWrapper.classList.remove('disable'); }
    
        } });
    }
    
    function lastSlideTextPrevAni() {
        gsap.to('.main-brandstory__last', .6, { autoAlpha: 0, onComplete: () => { 
                document.querySelector('.main-brandstory__slider').classList.remove('main-brandstory__slider--last');
                document.querySelector('.main-brandstory__content').classList.remove('main-brandstory__content--last');
                document.querySelector('.main-brandstory__content').removeAttribute('style');
                setTimeout(function(){
                    rollDown(); 
                    gsap.to('.main-brandstory__desc-wrap', .6, { autoAlpha: 1 });
                }, 600)
            } 
        });
    }
    
    window.addEventListener("mousemove", handleMousemove);
    view.onResize = resize;
    
    init();
    
    // EASING
    function easeOutCubic(x) {
        return 1 - Math.pow(1 - x, 3);
    }
    
    })();