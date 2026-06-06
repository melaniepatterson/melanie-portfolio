/*
 * File       : js/jt-strap.js
 * Author     : STUDIO-JT (KMS, NICO, JUN, SUMI)
 *
 * SUMMARY:
 * JT Functions INIT
 * ON LOAD
 * ON RESIZE
 * JT Functions
 * Helpers
 */



(function(){

    

/* **************************************** *
 * JT Functions INIT
 * **************************************** */
// INPUT
JT.ui.add( select_init, true );

// LAZYLOAD
JT.ui.add( lazyload_init, true );

// LOADMORE
JT.ui.add( loadmore, true );

// MODULES
JT.ui.add( jt_modules_search, true );

// SHARE
JT.ui.add( share_popup_init, true );
JT.ui.add( share_clipboard, true );

// VIDEO
JT.ui.add( vimeo_play, true );
JT.ui.add( youtube_play, true );

// SINGLE
JT.ui.add( blocks_spacer, true );
// JT.ui.add( blocks_list_counter, true );

JT.ui.add( jt_accordion, true );



/* **************************************** *
 * ON LOAD
 * **************************************** */
window.addEventListener('load', function(){

    // add

});



/* **************************************** *
 * ON RESIZE
 * **************************************** */
// INITIALIZE RESIZE
function handleResize(){

    // setTimeout to fix IOS animation on rotate issue
    setTimeout(function(){

        JT.ui.call( 'blocks_spacer' );

    }, 100);

}

// Init resize on reisize
if( JT.browser('mobile') ) {
    window.addEventListener('orientationchange', handleResize);
} else {
    window.addEventListener('resize', handleResize);
}



/* **************************************** *
 * JT Functions
 * **************************************** */
/**
 * select 커스텀 스타일을 설정합니다.
 *
 * @version 1.0.0
 * @author STUDIO-JT (KMS)
 * @see {@link https://github.com/Choices-js/Choices|Choices API}
 * @requires choices.min.js
 * @requires choices.min.css
 * @requires jt-strap.css
 * @requires rwd-strap.css
 *
 * @example
 * <div class="jt-choices__wrap">
 *     <select class="jt-choices">
 *         <option value="op1">OP1</option>
 *         <option value="op2">OP2</option>
 *         <option value="op3">OP3</option>
 *     </select>
 * </div>
 */
function select_init() {

    if( !JT.browser('mobile') ) {

        document.querySelectorAll('.jt-choices').forEach((select) => {

            new Choices(select, {
                searchEnabled  : false,
                itemSelectText : '',
                shouldSort     : false
            });

        });

    }

}



/**
 * Image Lazyload
 *
 * @version 1.0.0
 * @author STUDIO-JT (KMS)
 * @requires jt-unveil.js
 * @description masonry UI의 경우 jt-lazyload 컨테이너에 jt-lazyload--masonry class를 추가로 붙여서 사용하는 것을 권장합니다.
 *
 * @example
 * <figure class="jt-lazyload">
 * 	 <span class="jt-lazyload__color-preview"></span>
 * 	 <img width="120" height="120" data-unveil="some_img_url.jpg" src="blank.gif" alt="" />
 * 	 <noscript><img src="some_img_url.jpg" alt="" /></noscript>
 * </figure>
 */
function lazyload_init(){
 
    // lazyload
    document.querySelectorAll('[data-unveil]').forEach(( image ) => { 
        new JtLazyload( image, 300, function(){
            image.addEventListener('load', function(){
                if( image.closest('.jt-lazyload') != null ) {
                    image.closest('.jt-lazyload').classList.add('jt-lazyload--loaded');
                } else {
                    image.classList.add('jt-lazyload--loaded');
                }
            });
        });
    });

}



/**
 * Ajax loadmore function
 *
 * @version 1.0.0
 * @author STUDIO-JT (NICO)
 */ 
function loadmore(){

    if( !!!document.getElementById('jt-loadmore') ) return;

    let isLoading = false;

    document.querySelector('#jt-loadmore a').addEventListener('click', function(e){

        e.preventDefault();

        if( isLoading ) return;
        isLoading = true;

        const _this        = this;
        const loadmoreBtn  = _this.parentNode;
        const listSelector = _this.getAttribute('data-loadmore-list');
        const list         = document.querySelector(listSelector);
        const url          = _this.getAttribute('href');
        const count        = _this.querySelector('.jt-loadmore__count');

        loadmoreBtn.classList.add('jt-loadmore--loading');

        fetch(url).then(( response ) => {
            return response.text();
        })
        .then(( html ) => {
        
            // DOM parser
            const parser = new DOMParser();
            const response = parser.parseFromString(html, 'text/html');

            // Get data
            let nextUrl = ( !!response.getElementById('jt-loadmore') ) ? response.querySelector('#jt-loadmore a').getAttribute('href') : undefined;
            let moreItems = null;
            let countNum = null;
            let totalNum = null;

            if( response.getElementsByClassName('jt-accordion').length > 0 ) { // Accordion

                moreItems = response.querySelectorAll('.jt-accordion__item');

                gsap.set( moreItems, { autoAlpha: 0, scale: 0.9 } );
                moreItems.forEach( (item) => { list.appendChild( item ) });
                gsap.to( moreItems, { autoAlpha: 1, scale: 1, duration: .3, stagger: .1 } );

                // lazyload_init();
                if ( response.getElementsByClassName('jt-accordion__img').length > 0 ) {
                    lazyload_init();
                }

            } else if (response.getElementsByClassName('global-product-list').length > 0 ){

                moreItems = response.querySelectorAll('.global-product-list__item');
                countNum = count.textContent;
                
                totalNum = (countNum > moreItems.length) ? countNum - moreItems.length : 0;

                gsap.set( moreItems, { autoAlpha: 0 } );
                moreItems.forEach( (item) => { list.appendChild( item ) });
                gsap.to( moreItems, { autoAlpha: 1, duration: .3, stagger: .1 } );
                lazyload_init();
                count.textContent = totalNum;

            } else if (response.getElementsByClassName('jt-newspress-list').length > 0 ){

                moreItems = response.querySelectorAll('.jt-newspress-list__item');
                countNum = count.textContent;
                
                totalNum = (countNum > moreItems.length) ? countNum - moreItems.length : 0;

                gsap.set( moreItems, { autoAlpha: 0 } );
                moreItems.forEach( (item) => { list.appendChild( item ) });
                gsap.to( moreItems, { autoAlpha: 1, duration: .3, stagger: .1 } );
                lazyload_init();
                count.textContent = totalNum;

            } else {

                // Nothing

            }

            // Update URL
            /*
            if ('history' in window && 'pushState' in history) {
                window.history.pushState(null, null, url);
            }
            */

            // Refresh scrolltrigger offset
            if( typeof ScrollTrigger != 'undefined' ) {
                ScrollTrigger.refresh();            
            }

            // Remove loading class after some delay to avoid
            setTimeout(function(){
                loadmoreBtn.classList.remove('jt-loadmore--loading');
            },300);

            if(nextUrl !== undefined){
                // Update url
                _this.setAttribute('href', nextUrl);

                // Update flag
                isLoading = false;
            } else {
                _this.remove();
                return;
            }

        })
        .catch(( error ) => {
            console.error(error);
        });

    });

}



/**
 * JT Modules 검색 기능지원
 *
 * @version 1.0.0
 * @author STUDIO-JT (KMS)
 */
function jt_modules_search(){

    if( !document.getElementsByClassName('jt-search').length ) return;

    const wrap     = document.querySelector('.jt-search__bundle');
    const input    = document.querySelector('.jt-search__input');
	const clearBtn = document.querySelector('.jt-search__reset');

	if( input.value.length > 0 ) wrap.classList.add('jt-search--active');

	// Input
    input.addEventListener('keydown', function(){
        wrap.classList.add('jt-search--active');
    });
    input.addEventListener('keyup', function(){
        if( input.value == '' ){
            wrap.classList.remove('jt-search--active');
        } else {
            wrap.classList.add('jt-search--active');
        }
    });
    input.addEventListener('focusout', function(){
        if( input.value == '' ){
            wrap.classList.remove('jt-search--active');
        } else {
            wrap.classList.add('jt-search--active');
        }
    });

	// Clear input
    clearBtn.addEventListener('click', function(e){

        e.preventDefault();
        e.stopPropagation();

        const temp = document.createElement('input');
        temp.setAttribute('type', 'text');
        temp.style.opacity = '0';
        temp.style.position = 'absolute';

        input.value = '';
        wrap.appendChild( temp );
        temp.focus();
        input.focus();
        temp.remove();

		wrap.classList.remove('jt-search--active');

    });

}



/**
 * SNS 공유 팝업창을 생성합니다.
 *
 * @version 1.0.0
 * @author STUDIO-JT (JUN)
 */
function share_popup_init(){

    let winPop = '';

    // SNS POPUP
    document.querySelectorAll('.jt-share__item').forEach((element) => {
        element.addEventListener('click', function(e){

            // return kakao share
            if( element.classList.contains('jt-share--kakaotalk') || element.classList.contains('jt-share--url') ) return false;

            e.preventDefault();

            // OPTIONS
            const options = {
                href        : element.getAttribute('href'), // 주소
                title       : 'shareWindow',                // 타이틀
                width       : '600',                        // { number } 열리는 창의 가로 크기
                height      : '600',                        // { number } 열리는 창의 세로 크기
                top         : '0',                          // { number } 열리는 창의 좌표 위쪽
                left        : '0',                          // { number } 열리는 창의 좌표 왼쪽
                status      : 'no',                         // { yes | no | 1 | 0 } 상태 표시바 보이거나 숨기기
                fullscreen  : 'no',                         // { yes | no | 1 | 0 } 전체 창 (기본값은 no)
                channelmode : 'no',                         // { yes | no | 1 | 0 } 채널모드 F11 키 기능이랑 같음
                location    : 'no',                         // { yes | no | 1 | 0 } 주소창 (기본값은 yes)
                menubar     : 'no',                         // { yes | no | 1 | 0 } 메뉴바 (기본값은 yes)
                toolbar     : 'no',                         // { yes | no | 1 | 0 } 툴바 (기본값은 yes)
                resizable   : 'yes',                        // { yes | no | 1 | 0 } 창 (기본값은 yes)
                scrollbars  : 'yes'                         // { yes | no | 1 | 0 } 창 스크롤바 (기본값은 yes)
            };

            // ALIGN CENTER
            const alignCenter = {
                top : Math.round((window.innerHeight / 2) - (options.height / 2)),
                left : Math.round((window.innerWidth / 2) - (options.width / 2))
            };

            // WINDOW OPEN            
            if( !winPop || (winPop && winPop.closed) ) {
                winPop = window.open(''+ options.href +'',''+ options.title +'','width='+ options.width +',height='+ options.height +',top='+ alignCenter.top +',left='+ alignCenter.left +',status='+ options.status +',fullscreen='+ options.fullscreen +', channelmode='+ options.channelmode+', location='+ options.location+', menubar='+ options.menubar +', toolbar='+ options.toolbar +', resizable='+ options.resizable +', scrollbars='+ options.scrollbars +'');
            } else {
                winPop.location.href = options.href;
                winPop.focus();
            }

        });
    });

}

    

/**
 * URL 클립보드
 * 
 * @version 1.0.0
 * @author STUDIO-JT (KMS)
 */
function share_clipboard(){

    if( navigator.clipboard && document.getElementsByClassName('jt-share--url').length > 0 ){

        document.querySelectorAll('.jt-share--url').forEach((element) => {

            element.addEventListener('click', function(e){
                e.preventDefault();
    
                const _this = this;
    
                if ( 'share' in navigator && JT.browser('mobile') ) {
                    const title = document.querySelector('meta[property="og:title"]').getAttribute('content');
                    const url = document.querySelector('link[rel="canonical"]').getAttribute('href');
    
                    navigator.share({
                        title: title,
                        url: url,
                    });
    
                    return false;
                } else {
                    navigator.clipboard.writeText(_this.getAttribute('href')).then(function(){
                        if ( !!!document.querySelector('.jt-share__tooltip') ) {
                            let tooltip = document.createElement('div');
                                tooltip.setAttribute('class', 'jt-share__tooltip');
                                tooltip.innerHTML = `<p class="jt-typo--15">${_this.getAttribute('data-tooltip')}</p>`;
    
                            _this.closest('.jt-share').appendChild(tooltip);
                        }
    
                        gsap.fromTo('.jt-share__tooltip', { autoAlpha: 0 }, { autoAlpha: 1, duration: .2, onComplete: function () { gsap.fromTo('.jt-share__tooltip', { autoAlpha: 1 }, { autoAlpha: 0, duration: .2, delay: 3, onComplete: function () { document.querySelector('.jt-share__tooltip').remove(); } }); } });
                    });
                }
            });

        })

    }

}



/**
 * Vimeo custom play
 *
 * @version 1.0.0
 * @author STUDIO-JT (KMS, NICO)
 * @see {@link https://developer.vimeo.com/|API}
 * @requires https://player.vimeo.com/api/player.js
 */
function vimeo_play(){

    if( !document.getElementsByClassName('jt-embed-video--vimeo').length ) return;

    // play if click on the poster
    document.querySelectorAll('.jt-embed-video--vimeo .jt-embed-video__poster').forEach((element) => {
        const poster = element;
		const parent = poster.closest('.jt-embed-video__inner');
		const iframe = parent.querySelector('iframe');

        poster.addEventListener('click', function(e){
            e.preventDefault();

            JT.globals.jt_vimeo_ready(function(){
				const video = new Vimeo.Player(iframe);
				gsap.set(iframe, { autoAlpha: 1 });
				gsap.to(poster, { autoAlpha: 0, duration: .6, onStart: function () { video.play(); } });
            });
        });
    });

}



/**
 * Youtube custom play
 *
 * @version 1.0.0
 * @author STUDIO-JT (NICO)
 * @see {@link https://developers.google.com/youtube/iframe_api_reference}
 */
function youtube_play(){

    if( !document.getElementsByClassName('jt-embed-video--youtube').length ) return;

	const tag = document.createElement('script');
	tag.src = 'https://www.youtube.com/iframe_api';

	const firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

	// if youtube api ready do your stuff
	window.onYouTubeIframeAPIReady = function() {

		// play if click on the poster
        document.querySelectorAll('.jt-embed-video--youtube .jt-embed-video__poster').forEach((element) => {

			const poster = element;
			const parent = poster.closest('.jt-embed-video__inner');
			const iframe = parent.querySelector('iframe');
			const iframeId = iframe.getAttribute('id');

			new YT.Player(iframeId,{
				events: {
					'onReady': function(event){
						poster.addEventListener('click', function(e){
                            e.preventDefault();

							event.target.playVideo();
                            gsap.to(poster, { autoAlpha: 0, duration: .6, onComplete: function () { poster.remove(); } });
						});
					}
				}
			});

		});

	}

}



/**
 * Gutenberg editor spacer block converter
 *
 * @version 1.0.0
 * @author STUDIO-JT (KMS)
 */
function blocks_spacer(){

    document.querySelectorAll('.wp-block-spacer').forEach((space) => {

        if( space.getAttribute('data-space') == null ) {
            space.setAttribute('data-space', space.style.height);
        }

        const heightOrigin = space.getAttribute('data-space');
        let heightConvert = heightOrigin.replace('px','');

        if( JT.isScreen(860) ){
            heightConvert = heightConvert/2;
        }

        space.style.height = heightConvert+'rem';

    });

}



/**
 * Gutenberg editor list block option support
 *
 * @version 1.0.0
 * @author STUDIO-JT (KMS)
 */
function blocks_list_counter(){

    document.querySelectorAll('.jt-blocks ol[reversed]').forEach((list) => {
        list.style.counterReset = 'item ' + (list.children.length + 1);
    });

}



/**
 * JT ACCORDION
 *
 * @version 2.0.0
 * @since 2023-04-06
 * @author STUDIO-JT (KMS, NICO)
 *
 * @example
 * Markup sample
 * <ul class="jt-accordion">
 *     <li class="jt-accordion__item">
 *         <div class="jt-accordion__head">
 *             <h2 class="jt-accordion__title">제목</h2>
 *             <div class="jt-accordion__control"><span class="sr-only">아코디언 토글</span></div>
 *         </div><!-- .jt-accordion__head -->
 *         <div class="jt-accordion__content">
 *             <div class="jt-accordion__content-inner">
 *                 ...
 *             </div><!-- .jt-accordion__content_inner -->
 *         </div><!-- .jt-accordion__content -->
 *     </li><!-- .jt-accordion__item -->
 *     .....
 * </ul>
 */
function jt_accordion() {

    const container = document.querySelectorAll('.jt-accordion');

    if( !!!container ){ return; }

    container.forEach((accordion) => {

        // 첫 게시물에 active 클래스 추가
        if( accordion.getAttribute('data-open') != 'false' ) {
            // accordion.querySelector('.jt-accordion__item').classList.add('jt-accordion--active');
        }

        // Toggle the accordion
        // Delegate click event to keep alive after adding content via ajax
        accordion.addEventListener('click', function(e){

            if( !!e.target.closest('.jt-accordion__head') ) {

                const item = e.target.closest('.jt-accordion__item');
                const itemImg = item.querySelector('.jt-accordion__img .jt-lazyload');

                if( item.classList.contains('jt-accordion--loading') || item.classList.contains('jt-accordion--comingsoon') ) return;
                item.classList.add('jt-accordion--loading');

                item.classList.toggle('jt-accordion--active');
                JT.slide.toggle( item.querySelector('.jt-accordion__content-inner'), 500, function(){
                    item.classList.remove('jt-accordion--loading');
                });

            }

            return false;

        });

    })

}



/* **************************************** *
 * Helpers
 * **************************************** */
/**
 * Vimeo script on demand
 *
 * @version 1.0.0
 * @author STUDIO-JT (KMS)
 */
JT.globals.jt_vimeo_ready = function( callback ){

	if( typeof callback != 'function' ) return;

	if( typeof Vimeo == 'undefined' ){

        const prior = document.getElementsByTagName('script')[0];
        
        let script = document.createElement('script');
        script.async = 1;

        script.onload = script.onreadystatechange = function( _, isAbort ) {
            if( isAbort || !script.readyState || /loaded|complete/.test(script.readyState) ) {
                script.onload = script.onreadystatechange = null;
                script = undefined;

                if( !isAbort ) return callback();
            }
        };

        script.src = 'https://player.vimeo.com/api/player.js';
        prior.parentNode.insertBefore(script, prior);
        
	} else {

		return callback();
        
	}

}



})();