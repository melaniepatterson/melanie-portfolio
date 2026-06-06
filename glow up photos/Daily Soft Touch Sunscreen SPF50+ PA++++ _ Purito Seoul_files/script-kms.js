/*
 * File   : js/script-kms.js
 * Author : STUDIO-JT (KMS)
 *
 * SUMMARY:
 * INIT
 * FUNCTIONS
 */



(function(){



/* **************************************** *
* INIT
* **************************************** */
product_single_picture();
product_single_shop();
product_single_options();
product_single_ingredients();
product_single_step_slider();
product_single_tabs();
product_single_proven_silder();



/* **************************************** *
* FUNCTIONS
* **************************************** */
// 제품 상세 상단 이미지 슬라이드
function product_single_picture(){

    if( ! document.body.classList.contains('single-product') ) { return; }

    const slider = document.querySelector('.product-single__slider');
    const paginationImg = [];

    // Pagination data
    slider.querySelectorAll('.product-single__slider-image').forEach(item => paginationImg.push(item.getAttribute('data-background')));

    // Slider init
    new Swiper(slider, {
        loop: true,
		speed: 400,
        autoplay: {
            delay: 3000,
            disableOnInteraction: false
        },
		preventInteractionOnTransition: true,
		followFinger: false,
		preloadImages: false,
		lazy: {
			loadPrevNext: true,
			loadOnTransitionStart: true
		},
		pagination: {
            el: slider.querySelector('.product-single__slider-pagination'),
            clickable: true,
            renderBullet: function (index, className) {
                return `<span class="${className}">
                            <span style="background-image: url(${paginationImg[index]});">${(index + 1)}</span>
                        </span>`;
            }
        },
    });

}



// 제품상세 구매하기
function product_single_shop(){

    if( ! document.body.classList.contains('single-product') ) { return; }

    const dialog = document.querySelector('.product-single-dialog');

    // Open
    document.querySelector('.product-single__buy').addEventListener('click', function(e){ e.preventDefault(); gsap.fromTo(dialog, { autoAlpha: 0, }, { autoAlpha: 1, duration: 0.3, ease: 'power2.out', onStart: function () { dialog.style.display = 'block'; } }); });

    // Close
    dialog.addEventListener('click', function(e){
        if( e.target.closest('.product-single-dialog__content') == null || e.target.closest('.product-single-dialog__close') != null ) {
            gsap.to(dialog, { autoAlpha: 0, duration: 0.3, ease: 'power2.out', onComplete: function () { dialog.style.removeProperty('display'); } });
        }
    });

}



// 제품상세 옵션 선택
function product_single_options(){

    if( ! document.body.classList.contains('single-product') ) { return; }

    let currentData = product_option_data[ 0 ];
    
    // 용량 변경
    if( document.querySelector('.product-single__price select') !== null ){

        document.querySelector('.product-single__price select').addEventListener('change', (e) => {
            currentData = product_option_data[ e.target.value ];
    
            // 가격
            document.querySelector('.product-single__price > p').innerHTML = currentData[ 'price' ];
    
            // 슬라이드 & 컬러칩 & 판매 사이트
            if( document.querySelector('.product-single__chip') != null ) {
                document.querySelector('.product-single__chip').remove();
            }
    
            if( currentData[ 'color' ][ 'use' ] ) { // 컬러칩 사용
    
                changeColor( currentData[ 'color' ][ 'data' ] );
    
            } else { // 컬러칩 미사용
    
                changeShop( currentData[ 'link' ] );
                changeGallery( currentData[ 'gallery' ] );
    
            }
        });

    }

    // 컬러칩 변경
    jQuery(document).on('click', '.product-single__chip-list > li', function(e){
        // Active
        document.querySelectorAll('.product-single__chip-list > li').forEach( li => li.classList.remove('product-single__chip--current') );
        this.classList.add('product-single__chip--current');

        // Data
        const colorData = currentData[ 'color' ][ 'data' ][ this.getAttribute('data-idx') ];

        document.querySelector('.product-single__chip-select > span').innerHTML = colorData[ 'title' ];

        changeShop( colorData[ 'link' ] );
        changeGallery( colorData[ 'gallery' ] );
    });

    // 컬러칩 데이터 처리
    function changeColor( data ) {

        const colorLabel = 'Select Color : ';

        // Group
        const colorList = document.createElement('div');
        colorList.classList.add('product-single__chip');
        colorList.innerHTML = `<ul class="product-single__chip-list"></ul>
                               <p class="product-single__chip-select jt-typo--15">${colorLabel}<span></span></p>`;

        const colorOpts = colorList.querySelector('.product-single__chip-list');
        const colorName = colorList.querySelector('.product-single__chip-select > span');
        
        // Items
        data.forEach( (color, idx) => {

            const item = document.createElement('li');
            item.setAttribute('data-idx', idx);
            item.innerHTML = `<i style="background-color: ${color[ 'code' ]};"></i><span class="sr-only">${color[ 'title' ]}</span>`;

            // 첫 아이템
            if( idx == 0 ) {
                colorName.innerHTML = color[ 'title' ];
                item.classList.add('product-single__chip--current');

                changeShop( color[ 'link' ] );
                changeGallery( color[ 'gallery' ] );
            }

            colorOpts.appendChild( item );

        });

        document.querySelector('.product-single__dafault').insertBefore( colorList, document.querySelector('.product-single__buy') );

    }

    // 판매 사이트 데이터 처리
    function changeShop( data ) {

        const shopList = document.querySelector('.product-single__shopnow');
        shopList.innerHTML = '';

        data.forEach( shop => {

            const platformName = shop[ 'platform' ]; // 판매 사이트명

            const shopItem = document.createElement('li');
            shopItem.classList.add( `product-single__shopnow--${ platformName.replace(/ /g, '').toLowerCase() }` );

            if( shop[ 'use_platform' ] ) {

                const item = document.createElement('a');

                item.setAttribute('href', shop[ 'link' ]);
                item.setAttribute('target', '_blank');
                item.setAttribute('rel', 'noopener');
                item.setAttribute('lang', 'en');
                item.classList.add('product-single__shopnow-primary');

                item.innerHTML = `<span class="jt-typo--13" lang="en">${platformName}</span><i class="jt-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path d="M13,3v8.9h-2V6.4l-7,7L2.6,12l7-7H4.1V3H13z" fill="black"></path></svg></i>`;
                
                shopItem.appendChild( item );

           } else {

                // Name
                const item = document.createElement('div');
                item.classList.add('product-single__shopnow-primary');
                item.innerHTML = `<span class="jt-typo--13" lang="en">${platformName}</span>`;

                shopItem.appendChild( item );

                // Child
                const childItem = document.createElement('ul');
                childItem.classList.add('product-single__shopnow-secondary');

                shop[ 'platforms' ].forEach( child => {

                    const li = document.createElement('li');
                    li.innerHTML = `<a href="${child[ 'link' ]}" target="_blank" rel="noopener">
                                        <span class="jt-typo--14" lang="en">${child[ 'name' ]}</span>
                                        <i class="jt-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path d="M13,3v8.9h-2V6.4l-7,7L2.6,12l7-7H4.1V3H13z" fill="black"></path></svg></i>
                                    </a>`;

                    childItem.appendChild( li );

                });

                shopItem.appendChild( childItem );

           }

           shopList.appendChild( shopItem );

        });

    }

    // 갤러리 데이터 처리
    function changeGallery( data ) {

        const slider = document.querySelector('.product-single__slider').swiper;
        const sliderItem = [];

        data.forEach( photo => {
            sliderItem.push( `<div class="product-single__slider-item swiper-slide"><div class="product-single__slider-image swiper-lazy" data-background="${photo}"></div></div>` );
        });

        slider.removeAllSlides();
        slider.appendSlide(sliderItem);

        slider.destroy(true, true);
        product_single_picture();

    }
    
}



// 제품상세 원료 영역
function product_single_ingredients(){
    
    if( ! document.body.classList.contains('single-product') ) { return; }
    
    // Slider init
    document.querySelectorAll('.product-single__itemize-images-slider').forEach((item) => {

        const slider = new Swiper(item, {
            preloadImages: false,
            lazy: {
                loadPrevNext: true,
                loadOnTransitionStart: true
            },
            effect: 'fade',
            fadeEffect: {
                crossFade: true
            }
        });

        item.swiper = slider;
    });
    
    // Hover ingredients
    jQuery('.product-single__itemize-images-key-list > li').hoverIntent(function(){ // Enter

        const $this = jQuery(this);
        const index = $this.index();
        const slider = $this.parents('.product-single__itemize-images').find('.product-single__itemize-images-slider')[0].swiper;;

        if( $this.hasClass('product-single__itemize-images-key--active') ) return;

        $this.addClass('product-single__itemize-images-key--active');
        jQuery('.product-single__itemize-images-key-list > li').not($this).removeClass('product-single__itemize-images-key--active');
        
        slider.slideTo(index, 600);

    });

}



// How to use 슬라이드
function product_single_step_slider(){

    if( !!!document.querySelector('.product-single__howto-step') ){ return; }

    const slider = document.querySelector('.product-single__howto-step');
    const sliderInner = document.querySelector('.product-single__howto-step ul');
    const sliderItems = document.querySelectorAll('.product-single__howto-step ul li');

    let ProductStepSlide = "undefined";

    function product_single_step_slider_risize(){

        if( JT.isScreen(860) ) { // 860px 이하

            slider.classList.add('swiper');
            sliderInner.classList.add('swiper-wrapper');

            sliderItems.forEach((item) => {
                item.classList.add('swiper-slide');
            })
    
            // slider
            ProductStepSlide = new Swiper(slider, {
                slidesPerView: 'auto', 
                pagination: {
                    el: '.swiper-pagination',
                    type: 'bullets',
                    clickable: true
                },
                hashNavigation: {
                    watchState: true, // ios pagination update debug
                },
            });
            
        } else { // 860px 이상

            if( ProductStepSlide != "undefined" ){
                ProductStepSlide.destroy();
                ProductStepSlide = "undefined";
            }

            slider.classList.remove('swiper');
            sliderInner.classList.remove('swiper-wrapper');
            slider.removeAttribute('style');
            sliderInner.removeAttribute('style');
    
            sliderItems.forEach((item) => {
                item.classList.remove('swiper-slide');
                item.removeAttribute('style');
            })
            
        }

    }
    product_single_step_slider_risize();
    window.addEventListener('resize', product_single_step_slider_risize);
    
}


function product_single_tabs(){

    if (!!!document.querySelector('.product-single__tabs')){ return; }

    document.querySelectorAll('.product-single__tabs').forEach((element) => {

        const _this    = element;
        const menu     = _this.querySelector('.jt-category-nav > ul');

        if (!!!menu){ return }
        
        const menuList = menu.querySelectorAll(':scope > li');
        const panel    = _this.querySelector('.product-single__tabs-panels');
        const itemList = panel.querySelectorAll(':scope > div');
        const isHash   = ( _this.classList.contains('jt-tabs--hash') ) ? true : false;

        // Hide tabs if not already hidden
        itemList.forEach( ( item ) => item.style.opacity = 0 );

		// Init display the right tab
        // TODO : DRY this stuff
		if( isHash && location.hash != '#' ) {
			if ( location.hash.length > 0 ) {
				const currentHash      = location.hash.replace(/#/,'');
                const currentItem      = document.getElementById(currentHash);
				const currentHashIndex = [].indexOf.call(itemList, currentItem) + 1;

				panel.querySelector(':scope > div:nth-child('+currentHashIndex+')').style.opacity = 1;
				menu.querySelector(':scope > li:first-child').classList.remove('jt-category--active');
				menu.querySelector(':scope > li:nth-child('+currentHashIndex+')').classList.add('jt-category--active');
			} else{
				panel.querySelector(':scope > div:first-child').style.opacity = 1;
				menu.querySelector(':scope > li:first-child').classList.add('jt-category--active');
			}
		} else {
			panel.querySelector(':scope > div:first-child').style.opacity = 1;
            menu.querySelector(':scope > li:first-child').classList.add('jt-category--active');
		}

        // Add click event
        menuList.forEach((element) => {
            const _that = element;

            _that.addEventListener('click', function(e){
                e.preventDefault();
                e.stopPropagation();
                
                const link  = _that.querySelector('a');
                const hash  = link.getAttribute('href');
                const index = [].indexOf.call(menuList, _that) + 1;

                menuList.forEach( ( item ) => item.classList.remove('jt-category--active') );
                menu.querySelector(':scope > li:nth-child('+index+')').classList.add('jt-category--active');

                itemList.forEach( ( item ) => item.style.opacity = 0 );
                panel.querySelector(':scope > div:nth-child('+index+')').style.opacity = 1;

                JT.ui.call( 'lazyload_init' );

                // video restart
                const currentPanel = panel.querySelector(':scope > div:nth-child('+index+')');
                const bgs = currentPanel.querySelectorAll('.product-single__horiz-bg');

                bgs.forEach((bg) => {
                    if (bg.classList.contains('product-single__horiz-bg--video')) {

                        const video = bg.querySelector('iframe');
                        JT.globals.jt_vimeo_ready(function(){
                            const player = new Vimeo.Player(video);

                            player.getDuration().then(function (duration) {
                                player.setCurrentTime(0);
                                player.play();
                            });
                        })
                    }
                })
                
                // add hash
                if (isHash && 'history' in window && 'pushState' in history) {
                    history.pushState(null, null, hash)
                }
            });
        });

    });

}


function product_single_proven_silder(){

    let singleProvenSlider = "undefined";
    let singleProvenImgSlider = "undefined";

    // txt slider
    document.querySelectorAll('.product-single__proven-vertical-content').forEach((container) => {
        const slider = container.querySelector('.product-single__proven-vertical-slider');
        
        if (slider) {
            const pagination = container.querySelector('.swiper-pagination');
            
            // init
            singleProvenSlider = new Swiper(slider, {
                init: false,
                loop: true,
                speed: 600,
                preventInteractionOnTransition: true,
                followFinger: false,
                effect: 'fade',
                fadeEffect: {
                    crossFade: true
                },
                preloadImages: false,
                lazy: {
                    loadPrevNext: true,
                    loadOnTransitionStart: true
                },
                autoHeight: true,
                pagination: {
                    el: pagination,
                    type: 'fraction',
                    renderFraction: function(currentClass, totalClass){
                        return '<span class="' + currentClass + '"></span>' +
                                '<span class="swiper-pagination-slug">'+
                                    '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="25" viewBox="0 0 4 25">'+
                                        '<path d="M3 8H4L1 19H0L3 8Z">'+
                                    '</svg>'+
                                '</span>' +
                                '<span class="' + totalClass + '"></span>';
                    }
                },
                // navigation: {
                //     nextEl: container.querySelector('.swiper-button-next'),
                //     prevEl: container.querySelector('.swiper-button-prev'),
                // }
            });
        
            singleProvenSlider.init();

            singleProvenSlider.on('realIndexChange', function(){
                singleProvenImgSlider.slideTo( singleProvenSlider.realIndex + 1 );
                JT.ui.call( 'lazyload_init' );
            })
        }
    })

    // img slider
    document.querySelectorAll('.product-single__proven-vertical-img-slider').forEach((slider) => {

        singleProvenImgSlider = new Swiper(slider, {
            init: false,
            loop: true,
            speed: 600,
            preventInteractionOnTransition: true,
            followFinger: false,
            effect: 'fade',
            fadeEffect: {
                crossFade: true
            },
            preloadImages: false,
            lazy: {
                loadPrevNext: true,
                loadOnTransitionStart: true
            },
        });
    
        singleProvenImgSlider.init();
    });

    // custom navigation
    document.querySelectorAll('.product-single__proven-vertical-content .swiper-button').forEach((item) => {

        item.addEventListener('click', (e) => {
            
            e.preventDefault();

            if (item.classList.contains('swiper-button-prev')){
                singleProvenSlider.slidePrev();
                singleProvenImgSlider.slidePrev();
            }

            if (item.classList.contains('swiper-button-next')){
                singleProvenSlider.slideNext();
                singleProvenImgSlider.slideNext();
            }

        })

    });

}



})();