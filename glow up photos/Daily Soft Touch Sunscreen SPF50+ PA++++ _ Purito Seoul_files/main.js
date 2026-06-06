/*
 * File       : js/main.js
 * Author     : STUDIO-JT (KMS, NICO, Chaehee)
 *
 * SUMMARY:
 * Global Variable
 * JT Default Functions INIT
 * Other Functions INIT
 * ON LOAD
 * ON RESIZE
 * JT Default Functions
 * Other Functions
 * Helpers
 */



(function(){



/* **************************************** *
 * Global
 * **************************************** */
let windowWidth = window.innerWidth;



/* **************************************** *
 * JT Default Functions INIT
 * **************************************** */
gsap_config();

full_visual_height();

screen_nav_setting();
minimize_header();
small_screen_nav();
menu_pointer_support();

scroll_top();
scroll_down();

jt_fullvid();

screen_nav_a11y();

search_modal_init();
search_result_clear();



/* **************************************** *
* Other Functions INIT
* **************************************** */
main_logo_intro_motion();
main_visual_mask();
main_ingredient_appear_motion();
main_ingredient_slider_resize();
main_ingredient_bg_slider();
main_ingredient_card();
main_brandstory_helper();

global_product_slider();

jt_background_video();

product_list_sort_action();

language_action();



/* **************************************** *
 * ON LOAD
 * **************************************** */
window.addEventListener('load', function(){

    // Refresh bug fix
    if( window.scrollY > 0 ) {
        document.body.classList.add('jt-minimize-layout');
        document.getElementById('header').classList.add('minimize');
        document.body.classList.remove('motion');
    }

    if (
        document.body.classList.contains('home') ||
        document.body.classList.contains('page-template-brand-story') ||
        document.querySelector('.product-single__slogan') != null
    ){
        jt_marquee();
    }

    jt_fullvid();
});



/* **************************************** *
 * ON RESIZE
 * **************************************** */
// INITIALIZE RESIZE
function handleResize(){

    // setTimeout to fix IOS animation on rotate issue
    setTimeout(function(){
        
        main_ingredient_slider_resize();

        // only width resize check not height ( minimize address bar debugging )
        if (window.innerWidth !== windowWidth) {

            full_visual_height();
        }

    }, 100);

}

// Init resize on reisize
if( JT.browser('mobile') ) {
    window.addEventListener('orientationchange', handleResize);
} else {
    window.addEventListener('resize', handleResize);
}



/* **************************************** *
 * JT Default Functions
 * **************************************** */
/**
 * CUSTOM GSAP CONFIG ( Remove gsap warning from console )
 *
 * @version 1.0.0
 * @author STUDIO-JT (Nico)
 * @requires gsap.min.js
 */
function gsap_config(){

    gsap.config({
        nullTargetWarn: false,
        trialWarn: false
    });

}



/**
 * FIX HEADER ANIMATION
 *
 * @version 1.0.0
 * @author STUDIO-JT (KMS, Nico)
 * @requires gsap.min.js
 */
function minimize_header(){

    const header      = document.getElementById('header');
    const body        = document.body;
    let currentScroll = 0
    let lastScroll    = 0
    let moveScroll    = 10
    let didScroll     = null;

    if ( body.classList.contains('page-template-ingredients') ) { return; }

    const scrollOffset = ( body.classList.contains('home') ) ? 0 : header.offsetHeight;

    window.addEventListener('scroll', function(){

        didScroll = true;
            
        if ( window.scrollY > scrollOffset ) {
            body.classList.add('jt-minimize-layout');
            header.classList.add('minimize');
        } else {
            body.classList.remove('jt-minimize-layout');
            header.classList.remove('minimize');
        }

    });

    setInterval(function(){

        if( didScroll && !body.classList.contains('open-menu') ) {
            has_scrolled();
            didScroll = false;
        }

    }, 50);

    function has_scrolled(){

        currentScroll = window.scrollY;

        // Make sure they scroll more than move scroll
        if( Math.abs(lastScroll - currentScroll) <= moveScroll ) return;

        if( currentScroll > lastScroll ){ // ScrollDown
            if( currentScroll > window.innerHeight ){
                gsap.to(header, { duration: .4, autoAlpha: 0, y: -header.offsetHeight, ease: 'power3.out' });
            }
        }
        else { // ScrollUp
            gsap.to( header, {duration: .4, autoAlpha:1, y: 0, ease: 'power3.out' });
        }

        lastScroll = currentScroll;

    }

}



/**
 * small screen navigation
 *
 * @version 1.0.0
 * @author STUDIO-JT (KMS)
 * @requires gsap.min.js
 * @requires jt.js
 */
function small_screen_nav(){

    const body          = document.body,
          menuBtn       = document.querySelector('.small-menu-controller'),
          menuBtnLine01 = document.querySelector('.small-menu-controller__line--01'),
          menuBtnLine02 = document.querySelector('.small-menu-controller__line--02'),
          menuBtnLine03 = document.querySelector('.small-menu-controller__line--03'),
          menuContainer = document.querySelector('#small-menu-container'),
          overlay       = document.querySelector('#small-menu-overlay');
    let   isLoading     = false;

    // 2depth setting
	menuContainer.querySelectorAll('#small-menu > li.menu-item-has-children').forEach((item) => {

		const link = item.querySelector('a');
		const text = link.innerText;
		const items = item.querySelector('ul').innerHTML;

		item.querySelector('ul').innerHTML = '<li class="sub-menu__first"><a href="#">' + text + '</a></li><li class="sub-menu__depth"><ul class="sub-menu__depth-nav">' + items + '</ul></li>';

		// 2depth open (1depth click)
		link.addEventListener('click', function(e){
			e.preventDefault();

            const currList = item;
            const currChild = currList.querySelector(':scope > ul');

            if( window.getComputedStyle(currChild).display == 'none' ) {

                menuContainer.querySelectorAll('#small-menu > li').forEach( ( item ) => item.classList.remove('menu-item--open') );
                currList.classList.add('menu-item--open');

				// currChild.style.display = 'block';
				gsap.fromTo(currChild, {autoAlpha: 0},{autoAlpha: 1, duration: .3, onStart: function(){currChild.style.display = 'block'}});
            }
		});

	})

    // back to 1depth
    document.querySelectorAll('#small-menu li.sub-menu__first > a').forEach((anchor) => {

        anchor.addEventListener('click', function(e){
            e.preventDefault();

            const subMenu = anchor.closest('ul');

            if (subMenu.classList.contains('menu-item--open')){
                subMenu.classList.remove('menu-item--open');
            }
            gsap.to(subMenu, {autoAlpha: 0, duration: .2, onComplete: function(){ subMenu.style.display = 'none' }});
        })

    })
    
    // 메뉴 열기/닫기
    menuBtn.addEventListener('click', function(e){
        e.preventDefault();

        if( isLoading ) return;
        isLoading = true;

        if( !body.classList.contains('open-menu') ){
            open_menu();
        } else {
			close_menu();
		}
    });

    // 메뉴 열기
    function open_menu(){

        body.classList.add('open-menu', 'open-menu--motion');

		// Scroll
        const scrollStorage = window.scrollY;
        body.classList.add('open-menu-fixed');
        body.classList.remove('logo-expand');
        body.setAttribute('data-scrolltop', scrollStorage);

        if( JT.browser('mobile') && JT.isScreen(540) ) {
            setTimeout(function(){
                body.style.position = 'fixed';
            }, 300);
        }

        // Active menu check
        menuContainer.querySelectorAll('#small-menu > li').forEach((item) => {
			if( item.classList.contains('current-menu-ancestor') || item.classList.contains('current-menu-item') ){
                item.classList.add('menu-item--open');

				if( !!item.querySelector(':scope > ul') ) {

                    item.querySelector(':scope > ul').style.display = 'block';
                    item.querySelector(':scope > ul').style.opacity = '1';
                    item.querySelector(':scope > ul').style.visibility = 'visible';
				}

                // Active menu to scroll
                if( item.classList.contains('menu-item--product') ){
                    const currentDepth = item.querySelector('.current-menu-item').closest('.menu-item-type-custom');
                    const currentDepthIndex = Array.prototype.indexOf.call(currentDepth.parentNode.children, currentDepth);
                    const menuHeight = JT.isScreen(540) ? 35 : 41;
                    let menuIndex = 0;

                    document.querySelector('.sub-menu__depth').querySelectorAll('ul > li').forEach((el) => {
                        menuIndex++;
                        if( el.classList.contains('current-menu-item') ){
                            gsap.to('.sub-menu__depth', { duration: 0.1, scrollTo: { y: (currentDepthIndex * 64) + ((menuIndex - 1) * menuHeight) - 8 }, ease: 'none' });
                        }
                    })
                }

				return false;
			}
        });

        // Show
        if ( JT.isScreen(540) ){
            gsap.fromTo(menuContainer, {
                autoAlpha: 0
            }, {
                autoAlpha: 1,
                duration: .3,
                ease: 'power3.out',
                onStart: function () {
                    menuContainer.style.display = 'block';
                },
                onComplete: function() {
                    isLoading = false;
                }
            });
        }else {
            gsap.fromTo(overlay, .2, {autoAlpha: 0}, {autoAlpha: .3, onStart: function() { overlay.style.display = 'block'; }});
            gsap.fromTo(menuContainer, {
                x: '100%'
            }, {
                x: '0%',
                duration: .6,
                ease: 'power3.out',
                onStart: function () {
                    menuContainer.style.display = 'block';
                },
                onComplete: function() {
                    isLoading = false;
                }
            });
        }

        const positionY = menuBtn.getBoundingClientRect().width / 3; // Rem fix
		gsap.to(menuBtnLine01, { y: positionY, rotation: 45, duration: .3, ease: 'power4.inOut' });
        gsap.to(menuBtnLine02, { autoAlpha: 0, duration: .3, ease: 'power2.inOut' });
        gsap.to(menuBtnLine03, { y: -positionY, rotation: -45, duration: .3, ease: 'power4.inOut' });

    }

    // 메뉴 닫기
    function close_menu(){

        gsap.to(overlay, .3, { autoAlpha: 0, onComplete: function() { overlay.removeAttribute('style'); }});
		gsap.to(menuContainer, {
			autoAlpha:0,
            duration: .2,
			ease: 'power3.out',
			onStart: function(){
                if( JT.browser('mobile') && JT.isScreen(540) ) { body.style.removeProperty('position'); }
				window.scrollTo(0, body.getAttribute('data-scrolltop'));
                body.classList.remove('open-menu--motion', 'open-menu-fixed');
                body.removeAttribute('style');
			},
            onComplete: function() {
				JT.scroll.restore();

                menuContainer.style.display = 'none';
                gsap.set(menuContainer, {autoAlpha: 1});

				menuContainer.querySelectorAll('#small-menu > li').forEach( ( item ) => item.classList.remove('menu-item--open') );
                menuContainer.querySelectorAll('#small-menu > li > ul.sub-menu').forEach( ( item ) => item.style.display = 'none' );

                body.classList.remove('open-menu');

                isLoading = false;
            }
        });
		gsap.to(menuBtnLine01, { y: 0, rotation: 0, duration: .3, ease: 'power4.inOut' });
        gsap.to(menuBtnLine02, { autoAlpha: 1, duration: .3, ease: 'power2.inOut' });
        gsap.to(menuBtnLine03, { y: 0, rotation: 0, duration: .3, ease: 'power4.inOut' });

    }

	// Device rotation fix
    function small_screen_nav_resize(){

        if( body.classList.contains('open-menu') ){
            menuContainer.style.display = 'none';
            close_menu();
        }

    }

    if( JT.browser('mobile') ) {
        window.addEventListener('orientationchange', small_screen_nav_resize);
    } else {
        window.addEventListener('resize', small_screen_nav_resize);
    }

}



/**
 * navigation 2댑스 touch 기능 지원
 *
 * @version 1.0.0
 * @author STUDIO-JT (KMS)
 */
function menu_pointer_support(){

    const menus = document.querySelectorAll( '#menu > li.menu-item-has-children > a' );

    [].forEach.call( menus, function( item ){
        item.onclick = ( e ) => {
            e.preventDefault();
            e.stopPropagation();
        }
        item.onpointerdown = ( e ) => {
            if( e.pointerType == 'mouse' ) {
                const link = ( e.target.tagName.toLowerCase() == 'a' ) ? e.target : e.target.closest('a');
                window.location.href = link.getAttribute('href');
            }
        };
    });

}



function screen_nav_setting(){

    const header      = document.getElementById('header');
    const productMenu = document.querySelector('.menu-item--product');
    const productSubMenu = document.querySelector('.menu-item--product > ul.sub-menu');
    const banner = header.querySelector('.sub-menu-banner');
    const bannerImg = banner.querySelector('[data-unveil]');

    // sub menu setting
    let wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'sub-menu-container');

    productSubMenu.parentElement.insertBefore(wrapper, productSubMenu);
    wrapper.appendChild(productSubMenu);
    wrapper.appendChild(banner);

    setTimeout(function(){
        new JtLazyload( bannerImg, 300, function(){
            bannerImg.addEventListener('load', function(){
                if( bannerImg.closest('.jt-lazyload') != null ) {
                    bannerImg.closest('.jt-lazyload').classList.add('jt-lazyload--loaded');
                } else {
                    bannerImg.classList.add('jt-lazyload--loaded');
                }
            });
        });
    }, 100)

    // add class on hover
    if( !JT.isScreen('1023')) {

        productMenu.addEventListener('mouseenter', () => {
            header.classList.add('header--menu-hover');
        })

        // hide on mouseleave
        productMenu.addEventListener('mouseleave', () => {
            header.classList.remove('header--menu-hover');
        })
    }
}



/**
 * fixed scroll top button, animate scroll top
 *
 * @version 1.0.0
 * @author STUDIO-JT (KMS)
 * @requires gsap.min.js
 */
function scroll_top(){

    const body      = document.body,
          footer    = document.getElementById('footer'),
          scrollBtn = document.getElementById('go-top');

    scrollBtn.addEventListener('click', function(e){
        e.preventDefault();
        gsap.to(window, { duration: .4, scrollTo: 0, ease: 'power3.out' });
    });

    window.addEventListener('scroll', function(){
        if ( window.scrollY < body.scrollHeight - window.innerHeight - footer.offsetHeight ) {
            scrollBtn.classList.add('go-top--fix');
        } else {
            scrollBtn.classList.remove('go-top--fix');
        }

        if ( window.scrollY < window.innerHeight ) {
            scrollBtn.classList.add('go-top--hide');
        } else {
            scrollBtn.classList.remove('go-top--hide');
        }
    });

}



/**
 * animate scroll down
 *
 * @version 1.0.0
 * @author STUDIO-JT (KMS)
 * @requires gsap.min.js
 */
function scroll_down(){

    if( !!!document.querySelector('.scroll-down') ) return;

    document.querySelector('.scroll-down').addEventListener('click', function(e){

        e.preventDefault();

        const target = this.getAttribute('href');
        const targetTop = JT.offset.top(target);
        const headerHeight = document.getElementById('header').offsetHeight;

        if (document.querySelector('body').classList.contains('page-template-ingredients')){
            gsap.to(window, { duration: .6, scrollTo: targetTop, ease: 'power3.out' });
        }else {
            gsap.to(window, { duration: .6, scrollTo: (targetTop - headerHeight), ease: 'power3.out' });
        }
    });

}


/**
 * JT embed fullvid
 *
 * @version 1.0.0
 * @author STUDIO-JT (Nico)
 */
function jt_fullvid(){

    if( document.querySelectorAll('iframe.jt-fullvid').length < 1 ) { return; }

    let windowWidth = window.innerWidth,
        windowHeight = window.innerHeight;

    document.querySelectorAll('iframe.jt-fullvid').forEach((iframe) => {

        const iframeWidth = iframe.offsetWidth,
              iframeHeight = iframe.offsetHeight,
              ratio = iframeHeight / iframeWidth;

        const vidContainer = iframe.parentElement.closest('.jt-fullvid-container'),
              vidContainerWidth = vidContainer.offsetWidth,
              vidContainerHeight = vidContainer.offsetHeight;

        let newIframeWidth = vidContainerWidth,
            newIframeHeight = vidContainerWidth * ratio;
            
        // Get ratio
        if( newIframeHeight < vidContainerHeight ){
            newIframeHeight = vidContainerHeight;
            newIframeWidth = vidContainerHeight / ratio;
        }

        // Build markup
        iframe.setAttribute('data-ratio', ratio);
        iframe.style.width     = newIframeWidth + 'px';
        iframe.style.height    = newIframeHeight + 'px';
        iframe.style.display   = 'block';
        iframe.style.position  = 'absolute';
        iframe.style.top       = '50%';
        iframe.style.left      = '50%';
        iframe.style.transform = 'translate(-50%,-50%)';
    });

    // Resize
    window.addEventListener('resize', function(){

        windowWidth = window.innerWidth,
        windowHeight = window.innerHeight;

        document.querySelectorAll('iframe.jt-fullvid').forEach((iframe) => {

            const vidContainer = iframe.parentElement.closest('.jt-fullvid-container'),
              vidContainerWidth = vidContainer.offsetWidth,
              vidContainerHeight = vidContainer.offsetHeight;

            let newIframeWidth = vidContainerWidth,
                newIframeHeight = vidContainerWidth * iframe.getAttribute('data-ratio');

            if( newIframeHeight < vidContainerHeight ){
                newIframeHeight = vidContainerHeight;
                newIframeWidth = windowHeight / iframe.getAttribute('data-ratio');
            }

            iframe.style.width  = newIframeWidth + 'px';
            iframe.style.height = newIframeHeight + 'px';

        });

    });

}



/**
 * GNB menu ally setting
 *
 * @version 1.0.0
 * @author STUDIO-JT (sumi)
 */
function screen_nav_a11y() {

    document.querySelectorAll('#menu .menu-item').forEach((item) => {
        item.addEventListener('focusin', function(){
            item.classList.add('focusin');
            if (!document.getElementById('header').classList.contains('header--invert')){
                document.getElementById('header').classList.add('header--menu-hover');
            }
        });
        item.addEventListener('focusout', function(){
            if (!document.getElementById('header').classList.contains('header--invert')){
                document.getElementById('header').classList.remove('header--menu-hover');
            }
        });
    });

}



function search_modal_init(){

    const body = document.body;
    const openBtn= document.querySelector('.search-controller__btn');
    const closeBtn = document.querySelector('#search-modal__close');
    const popup = document.querySelector('#search-modal');
    const form = document.querySelector('#search-modal__form');
    const input = document.querySelector('.search-modal__field');
    const clear = document.querySelector('.search-modal__reset');
    const overlay = document.querySelector('#search-modal-overlay');

    // open
    openBtn.addEventListener('click', function(e){

        e.preventDefault();
        e.stopPropagation();

        if ( !body.classList.contains('open-search') ){
            open_search();
        }
    });

    // close
    closeBtn.addEventListener('click', function(e){

        e.preventDefault();
        e.stopPropagation();

        if ( body.classList.contains('open-search') ){
            close_search();
        }
    });

    // input
    input.addEventListener('keydown', function() {
        form.classList.add('active');
    });

    input.addEventListener('keyup', function() {
        var val = this.value;

        if (val === '') {
            form.classList.remove('active');
        } else {
            form.classList.add('active');
        }
    });

    input.addEventListener('focusin', function() {
        popup.classList.add('focus-in');
        form.classList.add('focus-in');
    });

    input.addEventListener('focusout', function() {
        if (this.value === '') {
            form.classList.remove('active');
        } else {
            form.classList.add('active');
        }

        setTimeout(function() {
            popup.classList.remove('focus-in');
            form.classList.remove('focus-in');
        }, 200);
    });

    // reset
    clear.addEventListener('click', function(e) {
        e.preventDefault();

        input.value = '';
        input.focus();
        form.classList.remove('active');
    });

    function open_search(){

        body.classList.add('open-search');

        gsap.fromTo(overlay, .2, {autoAlpha: 0}, {autoAlpha: .3,onStart: function() { overlay.style.display = 'block'; }});
        gsap.fromTo(popup, .3, {
            y: '-100%'
        }, {
            y: '0%',
            force3D: true,
            ease: 'power3.out',
            onStart: function() {
                JT.scroll.destroy();
                popup.style.display = 'block';
                JT.ui.call( 'lazyload_init' );
                search_modal_slider();
            },
            onComplete: function() {
                if( JT.browser('desktop') ) { input.focus(); }
            }
        });

    }

    function close_search(){

        gsap.to(overlay, .3, { autoAlpha: 0, onComplete: function() { overlay.removeAttribute('style'); }});
		gsap.to(popup, .4, {y: '-100%',force3D: true,ease: 'power3.out',
            onComplete: function() {
                JT.scroll.restore();
                form.classList.remove('active')
                form.classList.remove('focus-in')
                input.value = '';
                input.blur();
                popup.removeAttribute('style');
                openBtn.focus();
                body.classList.remove('open-search');
            }
        });

    }
}



function search_modal_slider(){

    if( !!!document.querySelector('.search-modal__product-list-wrap') ){ return; }

    const sliderWrap = document.querySelector('.search-modal__product');
    const slider = document.querySelector('.search-modal__product-list-wrap');
    const sliderPaging = slider.querySelector('.swiper-pagination');

    new Swiper(slider, {
        loop: true,
        slidesPerView: 'auto',
        preventInteractionOnTransition: true,
		followFinger: false,
        navigation: {
			nextEl: sliderWrap.querySelector('.swiper-button-next'),
			prevEl: sliderWrap.querySelector('.swiper-button-prev')
		},
        pagination: {
            el: sliderPaging,
            type: 'bullets',
            clickable: true
        },
        on: {
            beforeTransitionStart: function(){
                JT.ui.call( 'lazyload_init' );
            }
        }
    })

}


function search_result_clear(){

    const form = document.querySelector('.search-result-form');
    const input = document.querySelector('.search-result-form__field');
    const clear = document.querySelector('.search-result-form__reset');

    // input
	if (input) {
	    input.addEventListener('keydown', function() {
	        form.classList.add('active');
	    });

	    input.addEventListener('keyup', function() {
	        var val = this.value;

	        if (val === '') {
	            form.classList.remove('active');
	        } else {
	            form.classList.add('active');
	        }
	    });
	}

    // reset
	if (clear){
	    clear.addEventListener('click', function(e) {
	        e.preventDefault();

	        input.value = '';
	        input.focus();
	        form.classList.remove('active');
	    });
	}

}



/* **************************************** *
 * Other Functions
 * **************************************** */
function main_visual_mask(){

    if( !!!document.querySelector('.main-visual') ){ return; }

    const visual = document.querySelector('.main-visual');
    const visualBg = document.querySelectorAll('.main-visual__bg');

    visualBg.forEach((item) => {

        ScrollTrigger.matchMedia({
            "(min-width: 1201px)": function() {
                gsap.fromTo(item,{
                    clipPath: 'none'
                },{
                    clipPath: 'inset(58rem 40rem round 12rem)',
                    ease: 'none',
                    scrollTrigger : {
                        trigger : visual,
                        start: "20% 0%",
                        end: "45% 0%",
                        scrub : .6,
                    }
                });
            }, "(min-width: 861px) and (max-width: 1200px)": function() {
                gsap.fromTo(item,{
                    clipPath: 'none'
                },{
                    clipPath: 'inset(40rem 30rem round 12rem)',
                    ease: 'none',
                    scrollTrigger : {
                        trigger : visual,
                        start: "15% 0%",
                        end: "45% 0%",
                        scrub : .6,
                    }
                });
            }, "(min-width: 541px) and (max-width: 860px)": function() {
                gsap.fromTo(item,{
                    clipPath: 'none'
                },{
                    clipPath: 'inset(32rem 20rem round 12rem)',
                    ease: 'none',
                    scrollTrigger : {
                        trigger : visual,
                        start: "10% 0%",
                        end: "35% 0%",
                        scrub : .6,
                    }
                });
            }
        })
    });

}



function global_product_slider(){

    if( !!!document.querySelector('.global-product-list') || document.querySelector('.global-product-list').classList.contains('global-product-list--grid') ){ return; }

    const sliders = document.querySelectorAll('.global-product-list');

    let productSlider = "undefined";
    let count;

    function global_product_slider_resize(){

        sliders.forEach((item) => {

            const sliderPaging = item.parentNode.querySelector('.swiper-pagination');
            
            // if only child
            count = (item.classList.contains('col-4')) ? 4 : 3;

            if ( JT.isScreen(1023) ){
                count = (item.classList.contains('col-4')) ? 3 : 3;
            }
            if ( JT.isScreen(860) ){
                count = (item.classList.contains('col-4')) ? 2 : 2;
            }

            // swipe
            if( item.querySelectorAll('.swiper-slide').length > count && productSlider === "undefined" ) {

                item.classList.remove('global-product-list--noswipe');

                productSlider = new Swiper(item, {
                    loop: true,
                    speed: 400,
                    slidesPerView: 'auto',
                    preventInteractionOnTransition: true,
                    followFinger: false,
                    // lazy: true,
                    navigation: {
                        nextEl: item.querySelector('.swiper-button-next'),
                        prevEl: item.querySelector('.swiper-button-prev')
                    },
                    pagination: {
                        el: sliderPaging,
                        type: 'bullets',
                        clickable: true
                    },
                    on: {
                        beforeTransitionStart: function(){
                            JT.ui.call( 'lazyload_init' );
                        }
                    }
                });
            }

            // noswipe
            if( item.querySelectorAll('.swiper-slide').length <= count ) {
                if( productSlider != "undefined" ){
                    productSlider.destroy();
                    productSlider = "undefined";
                }
                item.classList.add('global-product-list--noswipe');
                item.querySelectorAll('img[loading="lazy"]').forEach((el) => {

                    const imgContainer = el.parentElement;
                    imgContainer.setAttribute('data-unveil', el.getAttribute('src'));
                    el.remove();

                    setTimeout(function(){
                        new JtLazyload( imgContainer, 300, function(){
                            imgContainer.addEventListener('load', function(){
                                if( imgContainer.closest('.jt-lazyload') != null ) {
                                    imgContainer.closest('.jt-lazyload').classList.add('jt-lazyload--loaded');
                                } else {
                                    imgContainer.classList.add('jt-lazyload--loaded');
                                }
                            });
                        });
                    }, 100)
                });
                return;
            }

        });
    }

    global_product_slider_resize();
    window.addEventListener('resize', global_product_slider_resize );
}


function jt_marquee(){
    var marquee = document.querySelectorAll('.jt-marquee');

	if( !marquee.length ) return;

	JT.globals.marquee_resize = function(){

		marquee.forEach((item, index) => {

			const this_id = 'st-marquee-' + index;

			if (item.style.display === "none") { return true; }

			let wrap = item.querySelector('.jt-marquee__inner');

			let divNum = null;

			if(JT.isScreen(768)){
				divNum =  45;
			} else {
				divNum =  120;
			}

            const spans = wrap.querySelectorAll('span')
			const speed = spans[0].offsetWidth / divNum;

            spans.forEach((spanItem) => {

                spanItem.style.animationDuration = speed + 's';

                spanItem.style.animationPlayState = 'running';

                if( ScrollTrigger.getById( this_id ) == undefined ) {
                    ScrollTrigger.create({
                        trigger: item,
                        id: this_id,
                        once: false,
                        onEnter: function(){
                            spanItem.style.animationPlayState = 'running';
                        },
                        onEnterBack: function(){
                            spanItem.style.animationPlayState = 'running';
                        },
                        onLeave: function(){
                            item.style.animationPlayState = 'paused';
                        },
                        onLeaveBack: function(){
                            item.style.animationPlayState = 'paused';
                        }
                    });
                }

            })

		});
	};

	// init
	marquee.forEach((item, index) => {

		if (item.style.display === "none") { return true; }

		const con_width = item.getBoundingClientRect().width
		let wrap = null;

		item.innerHTML = "";

		item.insertAdjacentHTML('beforeend', '<div class="jt-marquee__inner"><span class="sample">'+item.getAttribute('data-label')+'</span></div>');
		wrap = item.querySelector('.jt-marquee__inner');

		const char_width = wrap.querySelector('.sample').getBoundingClientRect().width
		const count = Math.ceil(con_width/char_width) + 1;

		wrap.innerHTML = ""; // delete sample

		let html = '';
		for(i = 0; i<2; i++) {

			html += '<span>';

			for(j = 0; j<count; j++) {
				html += '<i>' + item.getAttribute('data-label') + '</i>';
			}

			html += '</span>'

		}
		wrap.insertAdjacentHTML('beforeend', html);

		if( index + 1 == marquee.length ){
			JT.globals.marquee_resize();
			window.addEventListener('resize', JT.globals.marquee_resize);
		}

	});
}



function jt_background_video() {

    if (!!!document.querySelectorAll('.jt-fullvid-container')) return;

    document.querySelectorAll('.jt-fullvid-container').forEach((item) => {
        const video = item.querySelector('iframe');

        if (video) {

            JT.globals.jt_vimeo_ready(function(){
                const player = new Vimeo.Player(video);
                const poster = item.querySelector('.jt-fullvid__poster-bg');
                let triggerTarget = video;

                player.getDuration().then(function (duration) {
                    player.setCurrentTime(0);
                    player.play();

                    player.on('timeupdate', function (data) {

                        if (data.seconds > 0) {
                            player.off('timeupdate');

                            if (poster.style.display !== 'none') {
                                gsap.to(poster, .2, { autoAlpha: 0, onComplete: function () { poster.style.display = 'none'; } });
                            }

                            // pause
                            if (!item.classList.contains('jt-autoplay-inview--play')) {
                                player.pause();
                            } else {
                                if (poster.style.display !== 'none') {
                                    player.pause();
                                    player.setCurrentTime(0);

                                    gsap.to(poster, {
                                        duration: .2,
                                        autoAlpha: 0,
                                        delay: .05,
                                        onStart: function () {
                                            setTimeout(function () {
                                                player.play();
                                            }, 50);
                                        },
                                        onComplete: function () {
                                            poster.style.display = 'none';
                                        }
                                    });
                                }
                            }
                        }
                    });

                    // check trigger target
                    const dataInViewTarget = video.parentElement.closest('.jt-autoplay-inview').getAttribute('data-inview-target');

                    if (dataInViewTarget != undefined) {
                        triggerTarget = document.querySelector(dataInViewTarget);
                    }

                    // create scroll trigger
                    ScrollTrigger.create({
                        trigger: triggerTarget,
                        once: false,
                        onEnter: function () {
                            video.parentElement.closest('.jt-autoplay-inview').classList.remove('jt-autoplay-inview--paused');
                            video.parentElement.closest('.jt-autoplay-inview').classList.add('jt-autoplay-inview--play');
                
                            player.play();
                        },
                        onEnterBack: function () {
                            video.parentElement.closest('.jt-autoplay-inview').classList.remove('jt-autoplay-inview--paused');
                            video.parentElement.closest('.jt-autoplay-inview').classList.add('jt-autoplay-inview--play');
                        
                            player.play();
                        },
                        onLeave: function () {
                            video.parentElement.closest('.jt-autoplay-inview').classList.remove('jt-autoplay-inview--play');
                            video.parentElement.closest('.jt-autoplay-inview').classList.add('jt-autoplay-inview--paused');
                        
                            player.getPaused().then(function (paused) {
                                if (!paused) {
                                    player.pause();
                                }
                            });
                            
                        },
                        onLeaveBack: function () {
                            video.parentElement.closest('.jt-autoplay-inview').classList.remove('jt-autoplay-inview--play');
                            video.parentElement.closest('.jt-autoplay-inview').classList.add('jt-autoplay-inview--paused');
                        
                            player.getPaused().then(function (paused) {
                                if (!paused) {
                                    player.pause();
                                }
                            });
                        }
                    });

                    // window focus in/out
                    $(window).on("blur focus", function(e) {
                        var prevType = $(this).data("prevType");
                
                        if (prevType != e.type) {
                            switch (e.type) {
                                case "blur":
                                    video.parentElement.closest('.jt-autoplay-inview').classList.remove('jt-autoplay-inview--play');
                                    video.parentElement.closest('.jt-autoplay-inview').classList.add('jt-autoplay-inview--paused');
                                
                                    player.getPaused().then(function (paused) {
                                        if (!paused) {
                                            player.pause();
                                        }
                                    });
                                    
                                    break;
                                case "focus":
                                    video.parentElement.closest('.jt-autoplay-inview').classList.remove('jt-autoplay-inview--paused');
                                    video.parentElement.closest('.jt-autoplay-inview').classList.add('jt-autoplay-inview--play');
                                
                                    player.play();
                                    
                                    break;
                            }
                        }
                
                        $(this).data("prevType", e.type);
                
                    });
                });
            });
        }
    });

}



    
function main_ingredient_slider_resize(){

    if( !!!document.querySelector('.main-ingredient__slider') ){ return; }

    const slider = document.querySelector('.main-ingredient__slider');
    const sliderInner = document.querySelector('.main-ingredient__slider-inner');
    const sliderItems = document.querySelectorAll('.main-ingredient__slider-item');

    let mainIngredientSlide = "undefined";

    // reset active
    document.querySelectorAll('.main-ingredient__colgroup').forEach((item) => {
        if(item.classList.contains('main-ingredient__colgroup--active')){
            item.classList.remove('main-ingredient__colgroup--active');
        }
    })

    document.querySelectorAll('.main-ingredient__slider-index-item').forEach((item, index) => {
        if(index === 0){
            if (!item.classList.contains('main-ingredient__slider-index-item--active')){
                item.classList.add('main-ingredient__slider-index-item--active');
            }
        }else {
            if (item.classList.contains('main-ingredient__slider-index-item--active')){
                item.classList.remove('main-ingredient__slider-index-item--active');
            }
        }
    })


    if( JT.isScreen(860) ){

        if( mainIngredientSlide != "undefined" ){
            mainIngredientSlide.destroy();
            mainIngredientSlide = "undefined";
        }

        slider.classList.remove('swiper');
        sliderInner.classList.remove('swiper-wrapper');
        slider.removeAttribute('style');
        sliderInner.removeAttribute('style');

        sliderItems.forEach((item) => {
            item.classList.remove('swiper-slide');
            item.removeAttribute('style');
        })

    }else {

        if( mainIngredientSlide = "undefined" ){
            slider.removeAttribute('style');
            sliderInner.removeAttribute('style');
            slider.classList.add('swiper');
            sliderInner.classList.add('swiper-wrapper');

            sliderItems.forEach((item) => {
                item.removeAttribute('style');
                item.classList.add('swiper-slide');
            })
        }

        // slider
        mainIngredientSlide = new Swiper(slider, {
            preloadImages: false,
            lazy: {
                loadPrevNext: true,
                loadOnTransitionStart: true
            },
            touchRatio: 0,
            allowTouchMove: false,
            effect: 'fade',
            fadeEffect: {
                crossFade: true
            }
        })

        // Hover ingredients
        /*
        $('.main-ingredient__slider-index-item').each(function(){
            const $this = jQuery(this);
            const index = $this.index();

            if ( !JT.browser('mobile') ){
                $this.find('.main-ingredient__slider-index-link').hoverIntent(function(){ // Enter
                    if( $this.hasClass('main-ingredient__slider-index-item--active') ) return;

                    $this.addClass('main-ingredient__slider-index-item--active');
                    $('.main-ingredient__slider-index-item').not($this).removeClass('main-ingredient__slider-index-item--active');
                    
                    mainIngredientSlide.slideTo(index, 600);
                });
            }else {
                $this.find('.main-ingredient__slider-index-link').on('click', function(e){ // Click
                    e.preventDefault();

                    if( $this.hasClass('main-ingredient__slider-index-item--active') ) return;

                    $this.addClass('main-ingredient__slider-index-item--active');
                    $('.main-ingredient__slider-index-item').not($this).removeClass('main-ingredient__slider-index-item--active');
                    
                    mainIngredientSlide.slideTo(index, 600);
                });
            }

        })
        */

        jQuery('.main-ingredient__slider-index-list > li').hoverIntent(function(){ // Enter

            const $this = jQuery(this);
            const index = $this.index();
    
            if( $this.hasClass('main-ingredient__slider-index-item--active') ) return;
    
            $this.addClass('main-ingredient__slider-index-item--active');
            jQuery('.main-ingredient__slider-index-list > li').not($this).removeClass('main-ingredient__slider-index-item--active');
            
            mainIngredientSlide.slideTo(index, 600);
    
        });

    }
}




function main_ingredient_bg_slider(){

    if( !!!document.querySelector('.main-ingredient__bg-list-wrap') ){ return; }

    const bgSlider = document.querySelectorAll('.main-ingredient__bg-list-wrap');

    bgSlider.forEach((slider) => {
        // If only child
        if( slider.querySelectorAll('.swiper-slide').length <= 1 ) {

            slider.classList.add('main-ingredient__bg-list-wrap--noswipe');
            return;
        }

        new Swiper(slider, {
            loop: true,
            speed: 600,
            preventInteractionOnTransition: true,
            followFinger: false,
            effect: 'fade',
            fadeEffect: {
                crossFade: true
            },
            pagination: {
                el: '.swiper-pagination',
                type: 'bullets',
                clickable: true
            }
        })
    })

}



function main_ingredient_card(){

    if( !!!document.querySelector('.main-ingredient__pop-btn') ){ return; }

    const popBtn = document.querySelectorAll('.main-ingredient__pop-btn');

    popBtn.forEach((item) => {

        item.addEventListener('click', (e) => {

            e.preventDefault();

            const cardItem = e.currentTarget.parentElement;

            if( cardItem.classList.contains('main-ingredient__colgroup--active') ){
                cardItem.classList.remove('main-ingredient__colgroup--active');
            }else {
                cardItem.classList.add('main-ingredient__colgroup--active');
            }
        })
    })



}



function main_ingredient_appear_motion(){

	const container = document.querySelector('.main-ingredient');
	const typo = document.querySelectorAll('.main-ingredient__title-item');

	typo.forEach((item,index) => {
		const highlight = item.querySelectorAll('.main-ingredient__title--highlight > i');
		let firstItem, firstHighlight, secondItem, secondHighlight;

		if (index === 0){
			firstItem = item;
			firstHighlight = item.querySelectorAll('.main-ingredient__title--highlight > i');
		}

		if (index === 1){
			secondItem = item;
			secondHighlight = item.querySelectorAll('.main-ingredient__title--highlight > i');
		}

		gsap.set(item, { opacity: 0 });
		gsap.set(highlight, { width: "0%" })

		const tl = gsap.timeline({
			scrollTrigger: {
				trigger: container,
				start: "top 80%",
			}
		})
		.to(firstItem, {
			opacity: 1,
			duration: .6,
		})
		.to(firstHighlight, {
			width: "100%",
			duration: .4,
			stagger: 0.2,
		}, '-=0.4')
		.to(secondItem, {
			opacity: 1,
			duration: .6,
			delay: .2,
		}, '-=0.2')
		.to(secondHighlight, {
			width: "100%",
			duration: .4,
			stagger: 0.2,
		},'-=0.4')
	})

}



function main_logo_intro_motion(){

	let flag = true;

    if ( !document.body.classList.contains('home') || window.scrollY > 0 ) return;

	function first_scroll_catch(e){

		if ( e.deltaY > 0 && flag ){

			flag = false;

			document.body.classList.remove('logo-expand');

			function onAnimationComplete(){
                ScrollTrigger.refresh();
			}

			document.querySelector('.main-container').addEventListener('transitionend', function(){
				if ( !document.body.classList.contains('logo-expand')){
					onAnimationComplete();
				}
			});

		}

        /*
		window.addEventListener('scroll', function (){
			if (window.scrollY === 0) {

				flag = true;

				if (!document.body.classList.contains('open-menu')) {
                    document.body.classList.add('logo-expand');
                }
			}
		})
        */
	}

    function first_touch_catch(e) {

        if (e.touches[0].clientY > 0 && flag) {

            flag = false;
            
            document.body.classList.remove('logo-expand');

            function onAnimationComplete() {
                ScrollTrigger.refresh();
            }

            document.querySelector('.main-container').addEventListener('transitionend', function () {
                if (!document.body.classList.contains('logo-expand')) {
                    onAnimationComplete();
                }
            });
        }

        /*
        window.addEventListener('scroll', function () {
            if (window.scrollY <= 0) {
                
                flag = true;

                if (!document.body.classList.contains('open-menu')) {
                    document.body.classList.add('logo-expand');
                }
            }
        });
        */
    }

	window.addEventListener('DOMMouseScroll', first_scroll_catch);
	window.addEventListener('mousewheel', first_scroll_catch);
	window.addEventListener('wheel', first_scroll_catch);

    window.addEventListener('touchmove', first_touch_catch);

}



function product_list_sort_action() {
    const list = document.querySelector('.product-list-container, .search-result');

    if (list && list.querySelector('[name=sort]') ){
        list.querySelector('[name=sort]').addEventListener('change', function () {
            window.location.href = this.value;
        });
    }
}




function language_action(){
    const langBtn = document.querySelector('.lang-menu-btn')

    // button
    langBtn.addEventListener('click', function(e){
        e.preventDefault();
    });
}



function main_brandstory_helper(){

    if ( !JT.browser('mobile') || !document.body.classList.contains('home') ) return;

    document.querySelector('.main-brandstory__slider-item--last').addEventListener('click', () => {
        document.querySelector('.main-brandstory__last .jt-btn__basic').click();
    })

}



// Full Visual Height (for device status bar)
function full_visual_height(){

    // height size
    document.querySelectorAll('.jt-full-h').forEach((visual)=> {

        if(window.screen.height === window.innerHeight){
            winHeight = window.screen.height;
        }else{
            winHeight = window.innerHeight;
        }
        visual.style.height = winHeight + 'px';
    });

}



})();