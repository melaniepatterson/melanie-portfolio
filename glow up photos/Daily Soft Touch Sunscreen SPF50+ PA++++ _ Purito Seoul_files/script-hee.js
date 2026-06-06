/*
 * File       : js/script-hee.js
 * Author     : STUDIO-JT (Chaehee)
 *
 * SUMMARY:
 * INIT
 * Functions
 */



(function(){


/* **************************************** *
 * Global
 * **************************************** */
let windowWidth = window.innerWidth;
let tutorialCheck = false;
    
    
/* **************************************** *
 * INIT
 * **************************************** */
ingredient_map();
ingredient_spotlight();

main_banner_motion();

jt_comingsoon();
custom_cursor();

gnb_tablet_setting();

product_shop_btn_motion();

jt_img_motion();

touch_lang_toggle();

footer_parenthesis_motion();

ingredient_mask_motion();
ingredient_card_motion();

global_img_appear_motion();
global_appear_motion();
global_rise_motion();

product_feature_motion();

single_share_sticky();
single_related_slider();

createme_how_slider();
jt_slotmachine();
visual_sound_control();



/* **************************************** *
 * ON LOAD
 * **************************************** */
window.addEventListener('load', function(){
    main_insta_marquee();
    article_visual_motion();
})



/* **************************************** *
 * ON RESIZE
 * **************************************** */
// INITIALIZE RESIZE
function handleResize(){

    // setTimeout to fix IOS animation on rotate issue
    setTimeout(function(){
        
        // only width resize check not height ( minimize address bar debugging )
        if (window.innerWidth !== windowWidth) {

            if ( document.querySelector('body').classList.contains('page-template-ingredients') ){
                window.location.reload();
            }
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
 * Functions
 * **************************************** */
function ingredient_map(){
    
    if ( !!!document.querySelector('.ingredients-view') ) return;

    const body = document.body;
    const container = document.querySelector('.ingredients-container');
    const viewInner = document.querySelector('.ingredients-view__inner');

    // progress (진행상태 표시 - mo)
    const progressBar = document.querySelector('.ingredients-progress-bar');
    const progress = document.querySelector('.ingredients-progress-bar > i');

    // tutorial popup (사용법 안내 UI)
    const tutorial = document.querySelector('.ingredients-tutorial');
    const closeBtn = document.querySelector('.ingredients-tutorial__close');

    // plane (지도 위 비행기 - 육지 경로에서는 숨김)
    const plane = document.querySelector('.ingredients-map__plane');
    const planeSVG = document.querySelector('.ingredients-map__plane > svg');

    // roads (지도 내 경로)
    const road = document.querySelector('.ingredients-map__road--whole');
    const roadPathWhole = road.querySelector('#path-whole');
    const roadPathCentella = road.querySelector('#path-centella');
    const roadPathDeepsea = road.querySelector('#path-deepsea');
    const roadPathOats = road.querySelector('#path-oats');
    const roadPathBamboo = road.querySelector('#path-bamboo');
    const roadPathMinari = road.querySelector('#path-minari');
    const roadPathHydrangea = road.querySelector('#path-hydrangea');
    
    const roadPathWholeDrawn = road.querySelector('#path-whole-drawn');
    const roadPathCentellaDrawn = road.querySelector('#path-centella-drawn');
    const roadPathDeepseaDrawn = road.querySelector('#path-deepsea-drawn');
    const roadPathOatsDrawn = road.querySelector('#path-oats-drawn');
    const roadPathBambooDrawn = road.querySelector('#path-bamboo-drawn');
    const roadPathMinariDrawn = road.querySelector('#path-minari-drawn');
    const roadPathHydrangeaDrawn = road.querySelector('#path-hydrangea-drawn');

    // map location (지도 내 주요 위치)
    const map = document.querySelector('.ingredients-map');
    const mapGosan = document.querySelector('.ingredients-map__location-item--goesan');
    const mapHapcheon = document.querySelector('.ingredients-map__location-item--hapcheon');
    const mapJeju = document.querySelector('.ingredients-map__location-item--jeju');
    const mapGangwon = document.querySelector('.ingredients-map__location-item--gangwon');
    const mapGunsan = document.querySelector('.ingredients-map__location-item--gunsan');
    const mapDamyang = document.querySelector('.ingredients-map__location-item--damyang');
    const mapCheongdo = document.querySelector('.ingredients-map__location-item--cheongdo');
    const mapJejuSecondary = document.querySelector('.ingredients-map__location-item--jeju-secondary');
    const mapJejuTertiary = document.querySelector('.ingredients-map__location-item--jeju-tertiary');

    const mapGosanDot = mapGosan.querySelector('.ingredients-map__location-dot');
    const mapHapcheonDot = mapHapcheon.querySelector('.ingredients-map__location-dot');
    const mapJejuDot = mapJeju.querySelector('.ingredients-map__location-dot');
    const mapGangwonDot = mapGangwon.querySelector('.ingredients-map__location-dot');
    const mapGunsanDot = mapGunsan.querySelector('.ingredients-map__location-dot');
    const mapDamyangDot = mapDamyang.querySelector('.ingredients-map__location-dot');
    const mapCheongdoDot = mapCheongdo.querySelector('.ingredients-map__location-dot');
    const mapJejuSecondaryDot = mapJejuSecondary.querySelector('.ingredients-map__location-dot');
    const mapJejuTertiaryDot = mapJejuTertiary.querySelector('.ingredients-map__location-dot');

    // cards and spot (카드 컨텐츠 및 스포트라이트)
    const cardWrap = document.querySelector('.ingredients-card');
    const cardInner = document.querySelector('.ingredients-card__inner');
    const cardPagination = document.querySelector('.ingredietns-card__pagination-current-inner');
    const cardCentella = document.querySelector('.ingredients-card--centella');
    const cardDeepsea = document.querySelector('.ingredients-card--deepsea');
    const cardOats = document.querySelector('.ingredients-card--oats');
    const cardBamboo = document.querySelector('.ingredients-card--bamboo');
    const cardMinari = document.querySelector('.ingredients-card--minari');
    const cardHydrangea = document.querySelector('.ingredients-card--hydrangea');
    const cardStarflower = document.querySelector('.ingredients-card--starflower');

    const cardCentellaSpot = cardCentella.querySelector('.ingredients-card__spotlight');
    const cardDeepseaSpot = cardDeepsea.querySelector('.ingredients-card__spotlight');
    const cardOatsSpot = cardOats.querySelector('.ingredients-card__spotlight');
    const cardBambooSpot = cardBamboo.querySelector('.ingredients-card__spotlight');
    const cardMinariSpot = cardMinari.querySelector('.ingredients-card__spotlight');
    const cardHydrangeaSpot = cardHydrangea.querySelector('.ingredients-card__spotlight');
    const cardStarflowerSpot = cardStarflower.querySelector('.ingredients-card__spotlight');

    const startPos = mapGosan.getBoundingClientRect().top - map.getBoundingClientRect().top - window.innerHeight/2 + 'px';

    // location fill color
    const locationDefault = '#F0EFED';
    const locationPrimary = '#E1E1DE';
    
    // reset (초기설정)
    gsap.set( roadPathWholeDrawn, { drawSVG: "0%" } );
    gsap.set( roadPathCentellaDrawn, { drawSVG: "0%" } );
    gsap.set( roadPathDeepseaDrawn, { drawSVG: "0%" } );
    gsap.set( roadPathOatsDrawn, { drawSVG: "0%" } );
    gsap.set( roadPathBambooDrawn, { drawSVG: "0%" } ); 
    gsap.set( roadPathMinariDrawn, { drawSVG: "0%" } );
    gsap.set( roadPathHydrangeaDrawn, { drawSVG: "0%" } );
    gsap.set( map, { scale: .8 } );

    let tlRoad;
    let endPosPin;
    let endPosMotion;

    // 애니메이션 길이 조정
    if ( JT.isScreen('860') ) {
        endPosPin = "900% 100%";
        endPosMotion = "900% 100%";
    }else {
        endPosPin = "1800% 100%";
        endPosMotion = "1800% 100%";
    }

    // map fix
    ScrollTrigger.create({
        trigger: viewInner,
        pin: viewInner,
        start: startPos + " top",
        end: endPosPin,
    });

    // card fix
    ScrollTrigger.matchMedia({
        "all": function() {
            
            /*
                출발 및 활성화 모션
                - 텍스트 컬러변경
                - dot 컬러 변경
                - dot 컬러 깜빡깜빡 animation 실행
                - card spotlight 표시
                - #지역 진한 회색으로 컬러 변경

                이동 모션
                - 지도 이동 및 drawing
                - 비행기 이동

                도착 후 모션
                - spotlight 숨김
                - dot 깜빡 애니메이션 정지

                다음 지역 이동 시
                - 가존 출발 및 활성화 모션 전체 reset
                
                (반복)

                1. centella : 괴산 ~ 합천 ~ 제주 (육로, 3개의 지역)
                2. deepsea : 제주 ~ 강원 (비행기)
                3. oats : 강원 ~ 군산 (육로)
                4. bamboo : 군산 ~ 담양 (육로)
                5. hydrangea : 담양 ~ 제주 (비행기)
                6. starflower : 제주 ~ 제주 (이동 없음, 카드만 변경)

                * 원료가 추가될 때마다 비행기 start, end값 수정이 필요합니다. (motionPath)
                * 이부분은 수동으로 수치 조절이 필요합니다 .. 
                * css 에서 plane 'opacity 100%, scale 100'으로 조정해서 맞추시면 편합니다.
                
                코드 버전업
                - 2025.04.09 : 군산 (Oats) 원료 및 경로 추가와 함께 모션 코드 개선, 각 구간별로 경로가 추가되면 label을 추가하여 모션 추가

            */
            
            // draw road timeline
            tlRoad = gsap.timeline({
                scrollTrigger: {
                    trigger: viewInner,
                    start: startPos + " top",
                    end: endPosMotion,
                    scrub: 1,
                }
            });

            // 01 active (goesan)
            tlRoad.addLabel('gosan');
            tlRoad.to( mapGosan, { duration: .3, color: 'var(--color-primary)' }, 'gosan');
            tlRoad.to( mapGosanDot, { duration: .1, backgroundColor: 'var(--color-secondary)' }, 'gosan');
            tlRoad.set( mapGosanDot, { animationPlayState: 'running'});
            tlRoad.set( cardCentellaSpot, { autoAlpha: 0.6 });
            tlRoad.to( '#map-area-goesan', { duration: 1, fill: locationPrimary }, 'gosan');
            tlRoad.to( map, { duration: 10, scale: 1 }, 'gosan'); // 첫 진입 시 scale 키우기

            // 01 to 02 (goesan to hapcheon)
            tlRoad.addLabel('gosan-to-hapcheon');
            tlRoad.to( roadPathCentellaDrawn, {
                duration: 21.5,
                drawSVG: "44.3%",
                ease: "none",
            }, 'gosan-to-hapcheon-=10');
            tlRoad.to(plane, {
                duration: 21.5,
                motionPath: { 
                    path: roadPathWhole, 
                    align: roadPathWhole, 
                    alignOrigin: [0.5, 0.5], 
                    autoRotate: true, 
                    start: 0,
                    end: .114
                },
                ease: "none"
            }, '<=gosan-to-hapcheon');
            tlRoad.set( cardCentellaSpot, { autoAlpha: 0 }, 'gosan-to-hapcheon');
            tlRoad.set( mapGosanDot, { animationPlayState: 'paused'}, 'gosan-to-hapcheon')
    
            tlRoad.to( mapHapcheon, { duration: .3, color: 'var(--color-primary)'}, 'gosan-to-hapcheon+=11.5');
            tlRoad.set( mapHapcheonDot, { animationPlayState: 'running'}, '<=gosan-to-hapcheon')
            tlRoad.set( cardCentellaSpot, { autoAlpha: .6 }, '<=gosan-to-hapcheon');
            tlRoad.to( mapHapcheonDot, { duration: .1, backgroundColor: 'var(--color-secondary)'}, '<=gosan-to-hapcheon');
            tlRoad.to( '#map-area-hapcheon', { duration: 1, fill: locationPrimary }, '<=gosan-to-hapcheon');

            // 02 to 03 (hapcheon to jeju)
            tlRoad.addLabel('hapcheon-to-jeju');
            tlRoad.to( roadPathCentellaDrawn, {
                duration: 25.7,
                drawSVG: "100%",
                ease: "none",
            }, 'hapcheon-to-jeju-=1');
            tlRoad.to(plane, {
                duration: 25.7,
                motionPath: { 
                    path: roadPathWhole, 
                    align: roadPathWhole, 
                    alignOrigin: [0.5, 0.5], 
                    autoRotate: true, 
                    start: .114,
                    end: .254
                },
                ease: "none"
            }, '<=hapcheon-to-jeju');
            tlRoad.set( cardCentellaSpot, { autoAlpha: 0 }, 'hapcheon-to-jeju+=8.2');
            tlRoad.set( mapHapcheonDot, { animationPlayState: 'paused'}, '<=hapcheon-to-jeju');

            // reset 01, 02 (여기서 잠시 멈췄다가 비행기로 출발합니다.)
            tlRoad.addLabel('hapcheon-to-jeju-reset');
            tlRoad.to( mapJeju, { duration: .3, color: 'var(--color-primary)'}, 'hapcheon-to-jeju-reset');
            tlRoad.to( mapJejuDot, { duration: .1, backgroundColor: 'var(--color-secondary)' }, 'hapcheon-to-jeju-reset');
            tlRoad.to( mapGosan, { duration: .3, opacity: 0 }, 'hapcheon-to-jeju-reset');
            tlRoad.to( mapHapcheon, { duration: .3, opacity: 0 }, 'hapcheon-to-jeju-reset');
            tlRoad.to( mapGosan, { duration: .3, color: 'var(--color-gray-700)' }, 'hapcheon-to-jeju-reset');
            tlRoad.to( mapGosanDot, { duration: .3, backgroundColor: 'var(--color-gray-700)' }, 'hapcheon-to-jeju-reset');
            tlRoad.to( mapHapcheon, { duration: .3, color: 'var(--color-gray-700)' }, 'hapcheon-to-jeju-reset');
            tlRoad.to( mapHapcheonDot, { duration: .3, backgroundColor: 'var(--color-gray-700)' }, 'hapcheon-to-jeju-reset');
            tlRoad.set( mapJejuDot, { animationPlayState: 'running'}, 'hapcheon-to-jeju-reset')
            tlRoad.set( cardCentellaSpot, { autoAlpha: 0.6 }, 'hapcheon-to-jeju-reset');
            tlRoad.to( '#map-area-jeju', { duration: 1, fill: locationPrimary }, 'hapcheon-to-jeju-reset');
            tlRoad.to( '#map-area-goesan', { duration: .3, fill: locationDefault }, 'hapcheon-to-jeju-reset');
            tlRoad.to( '#map-area-hapcheon', { duration: .3, fill: locationDefault }, 'hapcheon-to-jeju-reset');
            tlRoad.to( roadPathCentellaDrawn, { duration: .3, opacity: 0 }, 'hapcheon-to-jeju-reset+=1');
            tlRoad.to( roadPathCentella, { duration: .3, opacity: 0 }, '<=hapcheon-to-jeju-reset');
            
            // 03 to 04 (jeju to gangwon)
            tlRoad.addLabel('jeju-to-gangwon');
            tlRoad.to( roadPathDeepsea, { duration: .3, opacity: 1 }, 'jeju-to-gangwon');
            tlRoad.to( roadPathDeepseaDrawn, {
                duration: 54,
                drawSVG: "100%",
                ease: "none"
            }, 'jeju-to-gangwon+=6');
            tlRoad.to(plane, {
                duration: 54,
                motionPath: { 
                    path: roadPathWhole, 
                    align: roadPathWhole, 
                    alignOrigin: [0.5, 0.5], 
                    autoRotate: true, 
                    start: .254,
                    end: .523
                },
                ease: "none"
            }, '<=jeju-to-gangwon');
            tlRoad.to( plane, { duration: .3, opacity: 1 }, '<=jeju-to-gangwon');
            tlRoad.to( planeSVG, { duration: 10, scale: 1 }, '<=jeju-to-gangwon'); // 비행기 탑승
            tlRoad.set( cardCentellaSpot, { autoAlpha: 0 }, '<=jeju-to-gangwon');
            tlRoad.set( mapJejuDot, { animationPlayState: 'paused'}, '<=jeju-to-gangwon');

            // 03 to 04 ingredient change
            tlRoad.addLabel('jeju-to-gangwon-change');

            // reset 3 (강원 도착할 때 노출되는 지역이 다시 업데이트 됩니다 - 군산, 담양, 청도, 제주) 
            tlRoad.addLabel('jeju-to-gangwon-reset');
            tlRoad.to( planeSVG, { duration: 10, scale: 0 }, 'jeju-to-gangwon-reset-=4'); // 비행기 하차
            tlRoad.to( mapJeju, { duration: .3, opacity: 0 }, 'jeju-to-gangwon-reset');
            tlRoad.to( mapGangwon, { duration: .1, color: 'var(--color-primary)'}, 'jeju-to-gangwon-reset');
            tlRoad.to( mapGunsan, { duration: .3, opacity: 1 }, 'jeju-to-gangwon-reset');
            tlRoad.to( mapDamyang, { duration: .3, opacity: 1 }, 'jeju-to-gangwon-reset');
            tlRoad.to( mapCheongdo, { duration: .3, opacity: 1 }, 'jeju-to-gangwon-reset');
            tlRoad.to( mapJejuSecondary, { duration: .3, opacity: 1 }, 'jeju-to-gangwon-reset');
            tlRoad.to( mapGangwonDot, { duration: .3, backgroundColor: 'var(--color-secondary)'}, 'jeju-to-gangwon-reset');
            tlRoad.set( mapGangwonDot, { animationPlayState: 'running'}, 'jeju-to-gangwon-reset')
            tlRoad.set( cardDeepseaSpot, { autoAlpha: 0.6 }, 'jeju-to-gangwon-reset');
            tlRoad.to( '#map-area-gangwon', { duration: .3, fill: locationPrimary }, 'jeju-to-gangwon-reset');
            tlRoad.to( '#map-area-jeju', { duration: .3, fill: locationDefault }, 'jeju-to-gangwon-reset');
            tlRoad.to( roadPathDeepsea, { duration: .3, opacity: 0}, 'jeju-to-gangwon-reset+=7.8');
            tlRoad.to( roadPathDeepseaDrawn, { duration: .3, opacity: 0}, '<=jeju-to-gangwon-reset');

            // 04 to 05 (gangwon to gunsan)
            tlRoad.addLabel('gangwon-to-gunsan');
            tlRoad.to( roadPathOats, { duration: .3, opacity: 1 }, 'gangwon-to-gunsan-=0.3');
            tlRoad.to( roadPathOatsDrawn, {
                duration: 36,
                drawSVG: "100%",
                ease: "none"
            }, 'gangwon-to-gunsan+=6');
            tlRoad.to(plane, {
                duration: 36,
                motionPath: { 
                    path: roadPathWhole, 
                    align: roadPathWhole, 
                    alignOrigin: [0.5, 0.5], 
                    autoRotate: true, 
                    start: .523,
                    end: .692
                },
                ease: "none"
            }, '<=gangwon-to-gunsan');
            tlRoad.set( cardDeepseaSpot, { autoAlpha: 0 }, 'gangwon-to-gunsan+=10');
            tlRoad.set( mapGangwonDot, { animationPlayState: 'paused'}, '<=gangwon-to-gunsan');

            // 04 to 05 ingredient change
            tlRoad.addLabel('gangwon-to-gunsan-change');
            
            // reset
            tlRoad.addLabel('gangwon-to-gunsan-reset');
            tlRoad.to( mapGunsan, { duration: .1, color: 'var(--color-primary)' }, 'gangwon-to-gunsan-reset');
            tlRoad.to( mapGunsanDot, { duration: .3, backgroundColor: 'var(--color-secondary)'}, 'gangwon-to-gunsan-reset');
            tlRoad.set( mapGunsanDot, { animationPlayState: 'running'}, 'gangwon-to-gunsan-reset');
            tlRoad.set( cardOatsSpot, { autoAlpha: 0.6 }, 'gangwon-to-gunsan-reset');
            tlRoad.to( '#map-area-gunsan', { duration: .3, fill: locationPrimary }, 'gangwon-to-gunsan-reset');
            tlRoad.to( '#map-area-gangwon', { duration: .3, fill: locationDefault }, 'gangwon-to-gunsan-reset');

            // 05 to 06 (gunsan to damyang)
            tlRoad.addLabel('gunsan-to-damyang');
            tlRoad.to( roadPathBamboo, { duration: .3, opacity: 1 }, 'gunsan-to-damyang-=0.3');
            tlRoad.to( roadPathBambooDrawn, {
                duration: 20,
                drawSVG: "100%",
                ease: "none"
            }, 'gunsan-to-damyang+=6');
            tlRoad.to(plane, {
                duration: 20,
                motionPath: { 
                    path: roadPathWhole, 
                    align: roadPathWhole, 
                    alignOrigin: [0.5, 0.5], 
                    autoRotate: true, 
                    start: .692,
                    end: .742
                },
                ease: "none"
            }, '<=gunsan-to-damyang');
            tlRoad.set( cardOatsSpot, { autoAlpha: 0 },'gunsan-to-damyang+=8');
            tlRoad.set( mapGunsanDot, { animationPlayState: 'paused'}, '<=gunsan-to-damyang');
            
            // 05 to 06 ingredient change
            tlRoad.addLabel('gunsan-to-damyang-change');
            
            // reset
            tlRoad.addLabel('gunsan-to-damyang-reset');
            tlRoad.to( mapDamyang, { duration: .1, color: 'var(--color-primary)' }, 'gunsan-to-damyang-reset');
            tlRoad.to( mapDamyangDot, { duration: .3, backgroundColor: 'var(--color-secondary)'}, 'gunsan-to-damyang-reset');
            tlRoad.set( mapDamyangDot, { animationPlayState: 'running'}, 'gunsan-to-damyang-reset');
            tlRoad.set( cardBambooSpot, { autoAlpha: 0.6 }, 'gunsan-to-damyang-reset');
            tlRoad.to( '#map-area-damyang', { duration: .3, fill: locationPrimary }, 'gunsan-to-damyang-reset');
            tlRoad.to( '#map-area-gunsan', { duration: .3, fill: locationDefault }, 'gunsan-to-damyang-reset');

            // 06 to 07 (damyang to cheongdo)
            tlRoad.addLabel('damyang-to-cheongdo');
            tlRoad.to( roadPathMinari, { duration: .3, opacity: 1 }, 'damyang-to-cheongdo-=0.3');
            tlRoad.to( roadPathMinariDrawn, {
                duration: 26,
                drawSVG: "100%",
                ease: "none"
            }, 'damyang-to-cheongdo+=6');
            tlRoad.to(plane, {
                duration: 26,
                motionPath: { 
                    path: roadPathWhole, 
                    align: roadPathWhole, 
                    alignOrigin: [0.5, 0.5], 
                    autoRotate: true, 
                    start: .742,
                    end: .847
                },
                ease: "none"
            }, '<=damyang-to-cheongdo');
            tlRoad.set( cardBambooSpot, { autoAlpha: 0 },'damyang-to-cheongdo+=10');
            tlRoad.set( mapDamyangDot, { animationPlayState: 'paused'}, '<=damyang-to-cheongdo');

            // 06 to 07 ingredient change
            tlRoad.addLabel('damyang-to-cheongdo-change');

            // reset
            tlRoad.addLabel('damyang-to-cheongdo-reset');
            tlRoad.to( mapCheongdo, { duration: .1, color: 'var(--color-primary)' }, 'damyang-to-cheongdo-reset');
            tlRoad.to( mapCheongdoDot, { duration: .3, backgroundColor: 'var(--color-secondary)'}, 'damyang-to-cheongdo-reset');
            tlRoad.set( mapCheongdoDot, { animationPlayState: 'running'}, 'damyang-to-cheongdo-reset');
            tlRoad.set( cardMinariSpot, { autoAlpha: 0.6 }, 'damyang-to-cheongdo-reset');
            tlRoad.to( '#map-area-cheongdo', { duration: .3, fill: locationPrimary }, 'damyang-to-cheongdo-reset');
            tlRoad.to( '#map-area-damyang', { duration: .3, fill: locationDefault }, 'damyang-to-cheongdo-reset');

            // 07 to 08 (cheongdo to jeju)
            tlRoad.addLabel('cheongdo-to-jeju');
            tlRoad.to( roadPathHydrangea, { duration: .3, opacity: 1 }, 'cheongdo-to-jeju-=0.3');
            tlRoad.to( roadPathHydrangeaDrawn, {
                duration: 30,
                drawSVG: "100%",
                ease: "none"
            }, 'cheongdo-to-jeju+=6');
            tlRoad.to(plane, {
                duration: 30,
                motionPath: { 
                    path: roadPathWhole, 
                    align: roadPathWhole, 
                    alignOrigin: [0.5, 0.5], 
                    autoRotate: true, 
                    start: .847,
                    end: 1
                },
                ease: "none"
            }, '<=cheongdo-to-jeju');
            tlRoad.to( planeSVG, { duration: 10, scale: 1 }, '<=cheongdo-to-jeju'); // 비행기 탑승
            tlRoad.to( plane, { duration: .3, opacity: 1 }, '<=cheongdo-to-jeju');
            tlRoad.set( cardMinariSpot, { autoAlpha: 0 }, 'cheongdo-to-jeju+=10');
            tlRoad.set( mapCheongdoDot, { animationPlayState: 'paused' }, '<=cheongdo-to-jeju');
            
            // 07 to 08 ingredient change
            tlRoad.addLabel('cheongdo-to-jeju-change');
            
            // reset
            tlRoad.addLabel('cheongdo-to-jeju-reset');
            tlRoad.to( planeSVG, { duration: 10, scale: 0 }, 'cheongdo-to-jeju-reset-=4'); // 비행기 하차
            tlRoad.to( mapJejuSecondary, { duration: .1, color: 'var(--color-primary)' }, 'cheongdo-to-jeju-reset');
            tlRoad.to( mapJejuSecondaryDot, { duration: .3, backgroundColor: 'var(--color-secondary)' }, 'cheongdo-to-jeju-reset');
            tlRoad.set( mapJejuSecondaryDot, { animationPlayState: 'running'}, 'cheongdo-to-jeju-reset');
            tlRoad.set( cardHydrangeaSpot, { autoAlpha: 0.6 }, 'cheongdo-to-jeju-reset');
            tlRoad.to( '#map-area-jeju', { duration: .3, fill: locationPrimary }, 'cheongdo-to-jeju-reset');
            tlRoad.to( '#map-area-cheongdo', { duration: .3, fill: locationDefault }, 'cheongdo-to-jeju-reset');

            // 08 to 09 jeju to jeju
            tlRoad.addLabel('jeju-to-jeju');
            tlRoad.set( cardHydrangeaSpot, { autoAlpha: 0 },'jeju-to-jeju');
            tlRoad.set( mapJejuSecondaryDot, { animationPlayState: 'paused' }, 'jeju-to-jeju');
            tlRoad.set( mapJejuTertiary, { color: 'var(--color-primary)' }, 'jeju-to-jeju');
            tlRoad.set( mapJejuTertiaryDot, { backgroundColor: 'var(--color-secondary)'}, 'jeju-to-jeju');
            tlRoad.to( mapJejuSecondary, { duration: 9, opacity: 0 }, 'jeju-to-jeju');
            tlRoad.to( mapJejuTertiary, { duration: 9, opacity: 1 }, 'jeju-to-jeju');

            // 08 to 09 ingredient change
            tlRoad.addLabel('jeju-to-jeju-change');

            // reset
            tlRoad.addLabel('jeju-to-jeju-reset');
            tlRoad.set( mapJejuTertiaryDot, { animationPlayState: 'running'}, 'jeju-to-jeju-reset+=10');
            tlRoad.set( cardStarflowerSpot, { autoAlpha: 0.6 }, 'jeju-to-jeju-reset+=10');
            
            // reset all
            tlRoad.addLabel('ended');
            tlRoad.to( roadPathBambooDrawn, { duration: 1, opacity: 0 }, 'ended+=20');
            tlRoad.to( roadPathMinariDrawn, { duration: 1, opacity: 0 }, '<=ended');
            tlRoad.to( roadPathHydrangeaDrawn, { duration: 1, opacity: 0 }, '<=ended');
            tlRoad.to( plane, { duration: 1, opacity: 0 }, '<=ended');
            tlRoad.to( mapDamyang, { duration: 1, color: 'var(--color-gray-700)' }, '<=ended');
            tlRoad.to( mapDamyangDot, { duration: 1, backgroundColor: 'var(--color-gray-700)' }, '<=ended');
            tlRoad.to( mapCheongdo, { duration: 1, color: 'var(--color-gray-700)' }, '<=ended');
            tlRoad.to( mapCheongdoDot, { duration: 1, backgroundColor: 'var(--color-gray-700)' }, '<=ended');
            tlRoad.to( mapJejuSecondary, { duration: 1, color: 'var(--color-gray-700)' }, '<=ended');
            tlRoad.to( mapJejuSecondaryDot, { duration: 1, backgroundColor: 'var(--color-gray-700)' }, '<=ended');
            tlRoad.to( mapJejuTertiary, { duration: 1, color: 'var(--color-gray-700)' }, '<=ended');
            tlRoad.to( mapJejuTertiaryDot, { duration: 1, backgroundColor: 'var(--color-gray-700)' }, '<=ended');
            tlRoad.set( mapJejuSecondaryDot, { animationPlayState: 'paused'}, '<=ended');
            tlRoad.set( cardStarflowerSpot, { autoAlpha: 0 }, '<=ended');
            tlRoad.to( '#map-area-jeju', { duration: 1, fill: locationDefault }, '<=ended');
            tlRoad.to( '#map-area-cheongdo', { duration: 1, fill: locationDefault }, '<=ended');
            tlRoad.to({},{duration: 10}, '<=ended');

        },
        "(min-width: 861px)": function() {
            ScrollTrigger.create({
                trigger: viewInner,
                pin: cardWrap,
                start: "top top",
                end: endPosPin,
            });
            
            // 03 to 04 ingredient change
            tlRoad.to( cardInner, { duration: 10, top: -(cardDeepsea.getBoundingClientRect().top - cardInner.getBoundingClientRect().top - 60) }, 'jeju-to-gangwon-change-=25');
            tlRoad.to( cardCentella, { duration: 10, scale: .9 }, '<=jeju-to-gangwon-change');
            tlRoad.to( cardDeepsea, { duration: 10, scale: 1 }, '<=jeju-to-gangwon-change');
            
            // 04 to 05 ingredient change
            tlRoad.to( cardInner, { duration: 10, top: -(cardOats.getBoundingClientRect().top - cardInner.getBoundingClientRect().top - 60) }, 'gangwon-to-gunsan-change-=25');
            tlRoad.to( cardDeepsea, { duration: 10, scale: .9 }, '<=gangwon-to-gunsan-change');
            tlRoad.to( cardOats, { duration: 10, scale: 1 }, '<=gangwon-to-gunsan-change');
            tlRoad.to( roadPathOats, { duration: .3, opacity: 1 }, '<=gangwon-to-gunsan-change');
            
            // 05 to 06 ingredient change
            tlRoad.to( cardInner, { duration: 10, top: -(cardBamboo.getBoundingClientRect().top - cardInner.getBoundingClientRect().top - 60) }, 'gunsan-to-damyang-change-=18');
            tlRoad.to( cardOats, { duration: 10, scale: .9 }, '<=gunsan-to-damyang-change');
            tlRoad.to( cardBamboo, { duration: 10, scale: 1 }, '<=gunsan-to-damyang-change');
            tlRoad.to( roadPathBamboo, { duration: .3, opacity: 1 }, '<=gunsan-to-damyang-change');

            // 06 to 07 ingredient change
            tlRoad.to( cardInner, { duration: 10, top: -(cardMinari.getBoundingClientRect().top - cardInner.getBoundingClientRect().top - 60) }, 'damyang-to-cheongdo-change-=22');
            tlRoad.to( cardBamboo, { duration: 10, scale: .9 }, '<=damyang-to-cheongdo-change');
            tlRoad.to( cardMinari, { duration: 10, scale: 1 }, '<=damyang-to-cheongdo-change');
            tlRoad.to( roadPathMinari, { duration: .3, opacity: 1 }, '<=damyang-to-cheongdo-change');

            // 07 to 08 ingredient change
            tlRoad.to( cardInner, { duration: 10, top: -(cardHydrangea.getBoundingClientRect().top - cardInner.getBoundingClientRect().top - 60) }, 'cheongdo-to-jeju-change-=26');
            tlRoad.to( cardMinari, { duration: 10, scale: .9 }, '<=cheongdo-to-jeju-change');
            tlRoad.to( cardHydrangea, { duration: 10, scale: 1 }, '<=cheongdo-to-jeju-change');
            
            // 08 to 09 ingredient change
            tlRoad.to( cardInner, { duration: 10, top: -(cardWrap.offsetHeight - window.innerHeight) }, 'jeju-to-jeju-change-=5');
            tlRoad.to( cardHydrangea, { duration: 10, scale: .9 }, '<=jeju-to-jeju-change');
            tlRoad.to( cardStarflower, { duration: 10, scale: 1 }, '<=jeju-to-jeju-change');

        }, "(max-width: 860px)": function() {

            /*
                모바일 모션도 대부분 동일하지만, 다음과 같은 차이점이 있습니다.
                - spotlight 제거
                - 카드 전환 방식 변경
            */

            // 03 to 04 ingredient change
            tlRoad.to( cardInner, { duration: 10, left: -cardCentella.clientWidth }, 'jeju-to-gangwon-change-=25');
            tlRoad.to( '.ingredietns-card__pagination-current-inner', { duration: 10, y: -( cardPagination.offsetHeight / 7 * 1 ) }, '<=jeju-to-gangwon-change');
            tlRoad.to( roadPathDeepsea, { duration: .3, opacity: 1 }, '<=jeju-to-gangwon-change');

            // 04 to 05 ingredient change
            tlRoad.to( cardInner, { duration: 10, left: -(cardCentella.clientWidth * 2) }, 'gangwon-to-gunsan-change-=25');
            tlRoad.to( '.ingredietns-card__pagination-current-inner', { duration: 10, y: -( cardPagination.offsetHeight / 7 * 2 ) }, '<=gangwon-to-gunsan-change');
            tlRoad.to( roadPathOats, { duration: .3, opacity: 1 }, '<=gangwon-to-gunsan-change');

            // 05 to 06 ingredient change
            tlRoad.to( cardInner, { duration: 10, left: -(cardCentella.clientWidth * 3) }, 'gunsan-to-damyang-change-=18');
            tlRoad.to( '.ingredietns-card__pagination-current-inner', { duration: 10, y: -( cardPagination.offsetHeight / 7 * 3 ) }, '<=gunsan-to-damyang-change');
            tlRoad.to( roadPathBamboo, { duration: .3, opacity: 1 }, '<=gunsan-to-damyang-change');

            // 06 to 07 ingredient change
            tlRoad.to( cardInner, { duration: 10, left: -(cardCentella.clientWidth * 4) }, 'damyang-to-cheongdo-change-=22');
            tlRoad.to( '.ingredietns-card__pagination-current-inner', { duration: 10, y: -( cardPagination.offsetHeight / 7 * 4 ) }, '<=damyang-to-cheongdo-change');
            tlRoad.to( roadPathMinari, { duration: .3, opacity: 1 }, '<=damyang-to-cheongdo-change');

            // 07 to 08 ingredient change
            tlRoad.to( cardInner, { duration: 10, left: -(cardCentella.clientWidth * 5) }, 'cheongdo-to-jeju-change-=26');
            tlRoad.to( '.ingredietns-card__pagination-current-inner', { duration: 10, y: -( cardPagination.offsetHeight / 7 * 5 ) }, '<=cheongdo-to-jeju-change');

            // 08 to 09 ingredient change
            tlRoad.to( cardInner, { duration: 10, left: -(cardCentella.clientWidth * 6) }, 'jeju-to-jeju-change-=5');
            tlRoad.to( '.ingredietns-card__pagination-current-inner', { duration: 10, y: -( cardPagination.offsetHeight / 7 * 6 ) }, '<=jeju-to-jeju-change');

            // progress move
            gsap.fromTo( progress, {
                width: 0,
            },{
                width: '100%',
                ease: 'none',
                scrollTrigger: {
                    trigger: document.querySelector('body'),
                    start: "0% 0%",
                    end: "100% 100%",
                    scrub: true
                }
            });

            // tutorial open
            ScrollTrigger.create({
                trigger: container,
                start: "0% 0%",
                onEnter: function(){
                    const scrollPosY = window.scrollY;
                    gsap.to( progressBar, { duration: .3, autoAlpha: 1 } );
                    if ( !tutorialCheck ) {
                        tlRoad.kill();

                        window.scrollTo(0,scrollPosY)
                        body.style.overflow = 'hidden';
                        body.classList.add('body--preventScroll');
                        body.setAttribute('data-scrolltop', scrollPosY);
    
                        gsap.to( tutorial, { duration: .3, autoAlpha: 1, onStart: () => { tutorial.style.display = "block"; } } );
                    }
                },
                onLeaveBack: function(){
                    gsap.to( progressBar, { duration: .2, autoAlpha: 0 } );
                }
            });

            // tutorial close
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
        
                gsap.to( tutorial, { duration: .3, autoAlpha: 0, onStart: () => { 
                    tutorialCheck = true;

                    body.removeAttribute('style');
                    body.classList.remove('body--preventScroll');
                    
                    ScrollTrigger.create({
                        trigger: viewInner,
                        start: startPos + " top",
                        end: endPosMotion,
                        scrub: 1,
                        onEnter: function(){
                            gsap.to('.ingredients-card', { duration: .3, autoAlpha: 1 });
                            cardWrap.classList.remove('ingredients-card--fixbottom');
                        },
                        onLeaveBack: function(){
                            gsap.to('.ingredients-card', { duration: .3, autoAlpha: 0 });
                        },
                        onLeave: function (){
                            cardWrap.classList.add('ingredients-card--fixbottom');

                        },
                        onEnterBack: function (){
                            gsap.to('.ingredients-card', { duration: .3, autoAlpha: 1 });
                            cardWrap.classList.remove('ingredients-card--fixbottom');
                        },
                        animation: tlRoad
                    });
                } });
            });
            
        }
        
    })

    // move focus
    // 비행기가 이동할 때마다 그의 반대 방향으로 지도가 이동합니다. 비행기가 항상 화면 중앙(50%,50%)에 위치하는 이유 
    // 비행기가 숨겨져 있어도 경로를 따라 계속 이동합니다.  
    gsap.ticker.add(() =>
        gsap.to(map, {
            duration: 1,
            x: -gsap.getProperty(plane, "x"),
            y: -gsap.getProperty(plane, "y")
        })
    );

}



function ingredient_spotlight() {

    if (!document.querySelector('.ingredients-view')) return;
    
    function updateSpotlight() {
        const spotlights = document.querySelectorAll('.ingredients-card__spotlight');
        const dots = document.querySelectorAll('.ingredients-map__location-dot');
        
        if (!dots.length) return;
        
        // 조건에 맞는 요소를 찾기
        const activeSpotlights = Array.from(spotlights).filter(item =>
            parseFloat(getComputedStyle(item).opacity) === 0.6
        );
        
        const runningDots = Array.from(dots).filter(item =>
            getComputedStyle(item).animationPlayState === 'running'
        );

        if (activeSpotlights.length && runningDots.length) {
            activeSpotlights.forEach(spotlight => {
                runningDots.forEach(dot => {
                    const activeDotPosY = dot.getBoundingClientRect().top;
                    const activeDotPosX = dot.getBoundingClientRect().left;
                    const cardCentellaPosY = spotlight.parentElement.getBoundingClientRect().top;
                    const cardCentellaPosX = spotlight.parentElement.getBoundingClientRect().left;
                    const cardWidth = spotlight.parentElement.offsetWidth;
                    const cardHeight = spotlight.parentElement.offsetHeight;

                    const percentageY = (activeDotPosY - cardCentellaPosY + dot.offsetHeight / 2) / cardHeight * 100;
                    const widthX = activeDotPosX - cardCentellaPosX - cardWidth + 10;

                    spotlight.style.clipPath = `polygon(0% 0%, 100% ${percentageY}%, 0% 100%)`;
                    spotlight.style.width = `${widthX}px`;
                });
            });
        }
    }

    let tickerAdded = false;

    function checkSpotlightActive() {
        const spotlights = document.querySelectorAll('.ingredients-card__spotlight');
        const dots = document.querySelectorAll('.ingredients-map__location-dot');

        let activeFound = false;

        const activeSpotlights = Array.from(spotlights).some(item =>
            parseFloat(getComputedStyle(item).opacity) === 0.6
        );

        const runningDots = Array.from(dots).some(item =>
            getComputedStyle(item).animationPlayState === 'running'
        );

        activeFound = activeSpotlights && runningDots;

        if (activeFound && !tickerAdded) {
            gsap.ticker.add(updateSpotlight);
            tickerAdded = true;
        } else if (!activeFound && tickerAdded) {
            gsap.ticker.remove(updateSpotlight);
            tickerAdded = false;
        }
    }

    gsap.ticker.add(checkSpotlightActive);
}



function main_banner_motion(){

    const mainBestBanner = document.querySelector('.main-best__new');
    const mainLineBanner = document.querySelector('.main-line__banner');
    const ingredientsBanner = document.querySelector('.ingredients-detail-topography');

    if ( mainBestBanner ) {
        ScrollTrigger.create({
            trigger: mainBestBanner,
            start: (JT.isScreen(540)) ? "90% 100%" : "75% 100%",
            // markers: true,
            onEnter: function(){
                mainBestBanner.classList.add('banner--loaded')
            }
        });
    }

    if ( mainLineBanner ) {
        ScrollTrigger.create({
            trigger: mainLineBanner,
            start: (JT.isScreen(540)) ? "90% 100%" : "75% 100%",
            onEnter: function(){
                mainLineBanner.classList.add('banner--loaded')
            }
        });
    }

    if ( ingredientsBanner ) {
        ScrollTrigger.create({
            trigger: ingredientsBanner,
            start: "60% 100%",  /* 모바일에서 90% 100% 수정 */
            // markers: true,
            onEnter: function(){
                ingredientsBanner.classList.add('banner--loaded')
            }
        });
    }
}



function jt_comingsoon(){

    document.querySelectorAll('.jt-btn-comingsoon').forEach((item) => {
        
        let html = document.createElement('div');
        let text = document.querySelector('body').classList.contains('lang-ko') ? '현재 페이지는 준비 중입니다. <br />조금만 기다려주세요' : 'This page is being prepared';

        html.setAttribute('class', 'jt-comingsoon-modal');

        html.innerHTML = `<div class="jt-comingsoon-modal__container">
                                <div class="jt-comingsoon-modal__inner">
                                    <h1 class="jt-typo--06" lang="en">Coming soon</h1>
                                    <p class="jt-typo--14">${text}</p>
                                </div>
                                <a class="jt-comingsoon-modal__close" href="#">
                                    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M28.2,5.2l-1.4-1.4L16,14.6L5.2,3.8L3.8,5.2L14.6,16L4.2,26.4l1.4,1.4L16,17.4l10.4,10.4l1.4-1.4L17.4,16L28.2,5.2z" fill="black"/>
                                    </svg>
                                </a>
                            </div>`;

        const close = html.querySelector('.jt-comingsoon-modal__close');

        // open
        item.addEventListener('click', (e) => {
    
            e.preventDefault();
            e.stopPropagation();
            
            document.querySelector('body').appendChild(html);
        })
        
        // close
        close.addEventListener('click', (e) => {
    
            e.preventDefault();
            html.remove();

        })
    })
}



// cursor custom
function custom_cursor(){

    var $cursor = null;
    var $inner = null;
    var $circle = null;
    var $txt = null;

    if ( JT.browser('mobile') || !document.querySelector('body').classList.contains('home') ) { return; }

    // default moving
    $('body').mousemove(function(e) {
        TweenMax.to($('#custom-cursor, #custom-cursor-text'), 1.3, {
            x: e.clientX,
            y: e.clientY,
            ease: Power3.easeOut
        });
    });

    // global cursor
    $(document).on({
        mouseenter: function(){
            $cursor = $('#custom-cursor, #custom-cursor-text');
            $inner = $cursor.find('.custom-cursor__inner');
            $circle = $cursor.find('.custom-hover-circle');
            $txt = $cursor.find('.custom-hover-text');

            var $this = $(this);
            var words = ( $this.data('hover') != undefined ) ? $this.data('hover') : '';
            var type = ( $this.data('type') != undefined ) ? $this.data('type') : '';
            var name = ( $this.data('name') != undefined ) ? $this.data('name') : '';
            var bgColor = "";
            var txtColor = "";

            // color setting
            bgColor = "rgba(255,88,53,.8)";
            txtColor = "#FCEEA3";

            if( $this.data('name') != undefined ){ $cursor.addClass(name); }

            if ( $this.data('hover') ){
                $txt.addClass( words );
                $txt.find('> span').text( words );
            }

            TweenMax.killTweensOf($circle);
            TweenMax.killTweensOf($txt);
            TweenMax.to($circle, .3, {width: '100%',height: '100%', autoAlpha: 1 ,ease: Power0.easeNone, onStart: function(){
                    TweenMax.set($circle, {backgroundColor: bgColor, borderColor: 'transparent', ease: Power0.easeNone});
                    TweenMax.set($txt, {color: txtColor, ease: Power0.easeNone});
                }
            });
            TweenMax.to($txt, .3, {width: '100%',height: '100%',autoAlpha: 1,ease: Power0.easeNone});
        },
        mouseleave: function(){
            $cursor = $('#custom-cursor, #custom-cursor-text');
            $inner = $cursor.find('.custom-cursor__inner');
            $circle = $cursor.find('.custom-hover-circle');
            $txt = $cursor.find('.custom-hover-text');

            var $this = $(this);
            var words = ( $this.data('hover') != undefined ) ? $this.data('hover') : '';

            $cursor.removeAttr('class');

            TweenMax.killTweensOf($circle);
            TweenMax.killTweensOf($txt);
            TweenMax.to($circle, .2, {width: '0%',height: '0%',autoAlpha: 0,ease: Power0.easeNone});
            TweenMax.to($txt, .2, {width: '0%',height: '0%',autoAlpha: 0,ease: Power0.easeNone, onComplete:function(){
                $txt.removeClass( words )
            }});
        }
    }, '.custom-hover');

}



function main_insta_marquee(){

    const marquee = document.querySelector('.main-insta__list-wrap');
    
    if( !document.querySelector('body').classList.contains('home') ){ return }
    if( marquee.length < 1 ) { return; }
    
    const marqueeOriginHtml = document.querySelector('.main-insta__list').innerHTML;
    let isMarqueePlay = false;

    function main_insta_resize(){
    
        if ( !JT.isScreen('540') ) {
            if (isMarqueePlay){
                marquee.querySelector('.jt-marquee__inner').remove();
                marquee.innerHTML = marqueeOriginHtml;
                isMarqueePlay = false;
                return;
            }
        }else {
            if (!isMarqueePlay){
                main_insta_marquee_init();
            }
        }
    }
    main_insta_resize();
    window.addEventListener('resize', main_insta_resize);

    // init
    function main_insta_marquee_init(){

        // init
        if (marquee.style.display === "none") { return true; }

        const con_width = marquee.getBoundingClientRect().width
        let wrap = null;

        let wrapHtml = marquee.querySelector('.main-insta__list').innerHTML;

        marquee.innerHTML = "";

        marquee.insertAdjacentHTML('beforeend', '<div class="jt-marquee__inner"><div class="sample">'+ wrapHtml +'</div></div>');
        wrap = marquee.querySelector('.jt-marquee__inner');

        const char_width = wrap.querySelector('.sample').getBoundingClientRect().width
        const count = Math.ceil(con_width/char_width) + 1;

        wrap.innerHTML = ""; // delete sample

        let html = '';

        for(i = 0; i<2; i++) {
            html += '<div class="main-insta__list">';
            for(j = 0; j<count; j++) {
                html += wrapHtml;
            }
            html += '</div>';
        }

        wrap.insertAdjacentHTML('beforeend', html);

        // lazyload
        const itemImgs = marquee.querySelectorAll('[data-unveil]');

        itemImgs.forEach((itemImg) => {
            setTimeout(function(){
                new JtLazyload( itemImg, 300, function(){
                    itemImg.addEventListener('load', function(){
                        if( itemImg.closest('.jt-lazyload') != null ) {
                            itemImg.closest('.jt-lazyload').classList.add('jt-lazyload--loaded');
                        } else {
                            itemImg.classList.add('jt-lazyload--loaded');
                        }
                    });
                });
            }, 100)
        });

        // animate
        let divNum = 40;
        
        const innerItems = wrap.querySelectorAll('.main-insta__list')
        const speed = innerItems[0].offsetWidth / divNum;
    
        innerItems.forEach((innerItem) => {
    
            innerItem.style.animationDuration = speed + 's';
            innerItem.style.animationPlayState = 'running';

            isMarqueePlay = true;
            
            ScrollTrigger.create({
                trigger: marquee,
                // id: this_id,
                once: false,
                onEnter: function(){
                    innerItem.style.animationPlayState = 'running';
                },
                onEnterBack: function(){
                    innerItem.style.animationPlayState = 'running';
                },
                onLeave: function(){
                    marquee.style.animationPlayState = 'paused';
                },
                onLeaveBack: function(){
                    marquee.style.animationPlayState = 'paused';
                }
            });
    
        })
    }
    
}



function gnb_tablet_setting(){

    if (JT.browser('mobile')){
        document.querySelectorAll('#side-menu > li.menu-item-has-children > a').forEach((item) => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
            })

        })
    }
}
        


function product_shop_btn_motion(){

    if (!JT.isScreen(860)) return;

    const buyBtn = document.querySelector('.product-single__buy-btn');
    const target = document.querySelector('.product-single__slogan');

    ScrollTrigger.create({
        trigger: target,
        start: window.innerHeight + "px 100%",
        onEnter: function(){
            gsap.to(buyBtn, { duration: .6, background: 'var(--color-secondary)' });
        },
        onLeaveBack: function(){
            gsap.to(buyBtn, { duration: .6, background: 'var(--color-primary)' });
        }
    })
}



function article_visual_motion(){

    if ( document.querySelectorAll('.article__visual').length < 1) return;

    const visual = document.querySelector('.article__visual');
    const bg = visual.querySelectorAll('.article__visual-bg');

    bg.forEach((item) => {
        imagesLoaded( visual, { background: item }, function() {
            item.classList.add('article__visual-bg--loaded');
        });
    })
    

}



function jt_img_motion(){

    /*
    * BG ZOOM IN ( overflow YES )
    *
    * example    : class="jt-motion--zoom" data-motion-offset="top 70%"
    */
    var $motion_bg = $('.jt-motion--zoom');

    $motion_bg.each(function(){
        
        var $this = $(this);
        var offset = $this.attr('data-motion-offset');

        if( offset == undefined ) { offset = (JT.isScreen(540)) ? 'top 98%' : 'top 70%'; }

        ScrollTrigger.create({
            trigger: $this,
            start: offset,
            // markers: true,
            onEnter: function(){
                $this.addClass('animate');
            },
        });
    });

    if( !JT.isScreen(860) && !JT.browser('mobile') ){
        $('.parallax-motion-y').each(function(){
        
            var $this = $(this);
            var bottomTop = $this.attr('data-bottom-top');
            var topBottom = $this.attr('data-top-bottom');
        
            gsap.fromTo($this,{
                y: bottomTop
            },{
                y: topBottom,
                ease: 'none',
                scrollTrigger : {
                    trigger : $this,
                    scrub : true
                }
            });
        
        })
    }
}



function touch_lang_toggle(){
    
    const langMenuBtn = document.querySelector('.lang-menu-btn');
    const langMenu = document.querySelector('.lang-menu');

    if ( JT.browser('mobile') ){

        langMenuBtn.addEventListener('click', (e) => {
            e.preventDefault();

            if ( !langMenu.classList.contains('lang-menu--open') ){
                langMenu.classList.add('lang-menu--open');
            }else {
                langMenu.classList.remove('lang-menu--open');
            }
        })
    }

    // hide menu on click background
    document.addEventListener('click', function(e){
    
        if( langMenu.classList.contains('lang-menu--open') ){

            if (!e.target.closest('.lang-menu-btn') && !e.target.closest('.lang-menu')){
                langMenu.classList.remove('lang-menu--open');
            }
        }

    })
}



function footer_parenthesis_motion(){

    const iconLeft = document.querySelector('.footer__extend-parenthesis--left');
    const iconRight = document.querySelector('.footer__extend-parenthesis--right');
    const startPos = "95% 100%";

    ScrollTrigger.matchMedia({
        "(min-width: 1601px)": function() {

            gsap.fromTo(iconLeft, {
                x: "60rem",
            },{
                x: 0,
                duration: .6,
                ease: 'power3.out',
                scrollTrigger : {
                    trigger: iconLeft,
                    start: startPos,
                }
            })

            gsap.fromTo(iconRight, {
                x: "-60rem",
            },{
                x: 0,
                duration: .6,
                ease: 'power3.out',
                scrollTrigger : {
                    trigger: iconRight,
                    start: startPos,
                }
            })

        }, "(min-width: 861px) and (max-width: 1600px)": function() {

            gsap.fromTo(iconLeft, {
                x: "30rem",
            },{
                x: 0,
                duration: .6,
                ease: 'power3.out',
                scrollTrigger : {
                    trigger: iconLeft,
                    start: startPos,
                }
            })

            gsap.fromTo(iconRight, {
                x: "-30rem",
            },{
                x: 0,
                duration: .6,
                ease: 'power3.out',
                scrollTrigger : {
                    trigger: iconRight,
                    start: startPos,
                }
            })
        }
    });
}



function ingredient_mask_motion(){

    if( !!!document.querySelector('.ingredients-detail-topography') ){ return; }

    const visual = document.querySelector('.ingredients-detail-topography');
    const visualBg = document.querySelectorAll('.ingredients-detail-topography__bg-wrap');

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
                        start: "0% 20%",
                        end: "15% 0%",
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
                        start: "0% 20%",
                        end: "15% 0%",
                        scrub : .6,
                    }
                });
            }, "(min-width: 541px) and (max-width: 860px)": function() {
                gsap.fromTo(item,{
                    clipPath: 'none'
                },{
                    clipPath: 'inset(32rem 20rem round 8rem)',
                    ease: 'none',
                    scrollTrigger : {
                        trigger : visual,
                        start: "0% 40%",
                        end: "80% 40%",
                        scrub : .6,
                    }
                });
            }, "(max-width: 540px)": function() {
                gsap.fromTo(item,{
                    clipPath: 'none'
                },{
                    clipPath: 'inset(32rem 16rem round 8rem)',
                    ease: 'none',
                    scrollTrigger : {
                        trigger : visual,
                        start: "0% 60%",
                        end: "80% 60%",
                        scrub : .6,
                    }
                });
            }
        })
    });
}



function ingredient_card_motion(){

    if( !!!document.querySelector('.ingredients-detail-process__list') ){ return; }

    const list = document.querySelector('.ingredients-detail-process__list');

    ScrollTrigger.matchMedia({
        "(min-width: 861px)": function() {
            gsap.set('.ingredients-detail-process__card', { opacity: 0 });

            gsap.fromTo('.ingredients-detail-process__card',{
                y: '60rem',
                opacity: 0,
            },{
                y: 0,
                opacity: 1,
                stagger: .2,
                duration: 1,
                ease: 'power1.out',
                scrollTrigger : {
                    trigger : list,
                }
            });
        }, "(max-width: 860px)": function() {
            document.querySelectorAll('.ingredients-detail-process__card').forEach((item)=>{ 
                item.removeAttribute('style');
            })

            document.querySelector('.ingredients-detail-process__list').classList.add('jt-motion--rise');
        }
    });
}


function product_feature_motion(){

    if( !!!document.querySelector('.product-single__features-screen') ){ return; }

    const targets = document.querySelectorAll('.product-single__features-screen');

    const startPos = (JT.isScreen(540)) ? 'top 100%' : 'top 80%';

    targets.forEach((target) => {
        ScrollTrigger.create({
            trigger: target,
            start: startPos,
            onEnter: function(){
                target.classList.add('animate');
            }
        });
    })
}



function global_img_appear_motion(){

    if (!!document.querySelector('.jt-img-motion--appear')){

        document.querySelectorAll('.jt-img-motion--appear').forEach((item) => {
    
            const startPos = (JT.isScreen(540)) ? 'top 100%' : 'top 80%';
            const dataDuration = item.getAttribute('data-duration');
            let durationTime;
    
            if ( !dataDuration ) {
                durationTime = 1;
            } else {
                durationTime = dataDuration;
            }
    
            // 절대 위치
            var absoluteTop = 0;
            var currentElement = item;
            while (currentElement.offsetParent) {
                absoluteTop += currentElement.offsetTop;
                currentElement = currentElement.offsetParent;
            }
    
            if (absoluteTop <= window.innerHeight ) { 
                ScrollTrigger.create({
                    trigger: item,
                    start: startPos,
                    // markers: true,
                    onEnter: function(){
                        item.classList.add('animate');
                    }
                });
                return; 
            }
    
            gsap.fromTo(item,{
                opacity: 0,
                y: 50,
            },{
                opacity: 1,
                y: 0,
                duration: durationTime,
                scrollTrigger: {
                    trigger: item,
                    start: startPos,
                    // markers: true,
                    onEnter: function(){
                        item.classList.add('animate');
                    }
                },
                ease: 'power2.out',            
            });
        });
        
    }
}


function global_rise_motion(){

    if (!!!document.querySelector('.jt-motion--rise')){ return; }

    var motionFunc = function(item, riseYOffset) {
        gsap.set(item, { y: riseYOffset, rotation: 0.1 });

        // trigger
        gsap.to(item, {
            duration: 1,
            y: 0,
            rotation: 0,
            force3D: true,
            ease: 'power1.out',
            scrollTrigger: {
                trigger: item,
                start: 'top 90%',
                // markers: true,
            },
            onComplete: function(){
                item.removeAttribute('style')
            }
        });
    }

    document.querySelectorAll('.jt-motion--rise').forEach((item) => {

        let riseYOffset = 50;

        if( JT.isScreen(1023) ) { riseYOffset = 30; }

        if ( item.classList.contains('jt-motion--rise-large')){
            ScrollTrigger.matchMedia({
                "(min-width: 861px)": function() {
                    motionFunc(item, riseYOffset);
                },"(max-width: 860px)" : function() {
                    item.removeAttribute('style');
                }
            });
        }else if ( item.classList.contains('jt-motion--rise-small')){
            ScrollTrigger.matchMedia({
                "(min-width: 861px)": function() {
                    item.removeAttribute('style');
                },"(max-width: 860px)": function() {
                    motionFunc(item, riseYOffset);
                }
            });
        }else {
            motionFunc(item, riseYOffset);
        }
    });
}



function global_appear_motion(){

    if (!!document.querySelector('.jt-motion--appear')){

        document.querySelectorAll('.jt-motion--appear').forEach((item) => {

            const startPos = (JT.isScreen(540)) ? 'top 100%' : 'top 80%';
            const dataDuration = item.getAttribute('data-duration');
            let durationTime = ( !dataDuration ) ? 1 : dataDuration; 

            var motionAppearFunc = function(item) {
                gsap.fromTo(item,{
                    opacity: 0,
                    y: (JT.isScreen(540)) ? 40 : 40,
                },{
                    opacity: 1,
                    y: 0,
                    duration: durationTime,
                    scrollTrigger: {
                        trigger: item,
                        start: startPos,
                        // markers: true,
                    },
                    ease: 'power1.out',            
                });
            }

            if ( item.classList.contains('jt-motion--appear-large')){
                ScrollTrigger.matchMedia({
                    "(min-width: 861px)": function() {
                        motionAppearFunc(item);
                    },"(max-width: 860px)" : function() {
                        item.removeAttribute('style');
                    }
                });
            }else if ( item.classList.contains('jt-motion--appear-small')){
                ScrollTrigger.matchMedia({
                    "(min-width: 861px)": function() {
                        item.removeAttribute('style');
                    },"(max-width: 860px)" : function() {
                        motionAppearFunc(item);
                    }
                });
            }else {
                motionAppearFunc(item);
            }

        })
    }


    if( !!document.querySelector('.jt-motion--stagger') ){

        document.querySelectorAll('.jt-motion--stagger').forEach((item) => {
            
            const items = item.querySelectorAll('.jt-motion--stagger-item');
            
            var motionStaggerFunc = function(item) {
    
                gsap.fromTo(items,{
                    y: (JT.isScreen(540)) ? 20 : 50,
                    opacity: 0,
                    rotation: 0.1
                },{
                    y: 0,
                    rotation: 0,
                    opacity: 1,
                    stagger: .2,
                    duration: 1,
                    ease: 'power1.out',
                    scrollTrigger : {
                        trigger : item,
                    }
                });
            }
            
            if ( item.classList.contains('jt-motion--stagger-large')){
                ScrollTrigger.matchMedia({
                    "(min-width: 861px)": function() {
                        motionStaggerFunc(item);
                    }
                });
            }else if ( item.classList.contains('jt-motion--stagger-small')){
                ScrollTrigger.matchMedia({
                    "(min-width: 861px)": function() {
                        gsap.set(items, { opacity: 1 })
                    }
                });
            }else {
                motionStaggerFunc(item);
            }
            
            
        })

    }
}



function single_share_sticky(){

    if( !!!document.querySelector('.jt-single__share') ){ return; }

    const content = document.querySelector('.jt-single__content')
    const target = document.querySelector('.jt-single__share');

    ScrollTrigger.matchMedia({
        "(min-width: 1024px)": function() {
            ScrollTrigger.create({
                trigger: content,
                start: "top top",
                end: "bottom bottom",
                // pin: target,
                onEnter: () => {
                    target.classList.add('jt-single__share--fixed')
                },
                onLeave: () => {
                    target.classList.add('jt-single__share--fixBottom')
                },
                onEnterBack: () => {
                    target.classList.remove('jt-single__share--fixBottom')
                },
                onLeaveBack: () => {
                    target.classList.remove('jt-single__share--fixed')
                }
            })
        }
    });
}



function createme_how_slider(){

    if( !!!document.querySelector('.createme-how__list-slider') ){ return; }

    const slider = document.querySelector('.createme-how__list-slider');

    new Swiper(slider, {
        loop: true,
        slidesPerView: 'auto',
        preventInteractionOnTransition: true,
        followFinger: true,
        centeredSlides: true,
        navigation: {
            nextEl: slider.querySelector('.swiper-button-next'),
            prevEl: slider.querySelector('.swiper-button-prev')
        },
        on: {
            init: function(){
                createme_how_slider_transition(true);
            },
            beforeTransitionStart: function(){
                JT.ui.call( 'lazyload_init' );
            },
            realIndexChange: function(){
                createme_how_slider_transition(false);
            }
        }
    })
}


function createme_how_slider_transition( isInit ){

    const slider = document.querySelector('.createme-how__list-slider').swiper;
    let prev = null;
    let curr = null;

    prev = slider.slides[slider.previousIndex];
    next = slider.slides[slider.activeIndex + 1];
    curr = slider.slides[slider.activeIndex];

    // Previous item
    if( !isInit ) {
        if( !!prev.querySelector('.jt-background-video video') ){

            const prevPoster = prev.querySelector('.jt-background-video__poster');

            prev.querySelector('.jt-background-video video').pause();
            prev.querySelector('.jt-background-video video').currentTime = 0;
            prevPoster.removeAttribute('style');
        }

        if( !!next.querySelector('.jt-background-video video') ){

            const nextPoster = next.querySelector('.jt-background-video__poster');
            
            next.querySelector('.jt-background-video video').pause();
            next.querySelector('.jt-background-video video').currentTime = 0;
            nextPoster.removeAttribute('style');
        }
    }

    // Current item
    if( !!curr.querySelector('.jt-background-video') ){

        const currVideoWrap = curr.querySelector('.jt-background-video__vod');
        const currPoster = curr.querySelector('.jt-background-video__poster');
        const source = currVideoWrap.getAttribute('data-jt-lazy');
        let currVideo = currVideoWrap.querySelector('video');

        let initialPlay = true;
        
        if(!currVideo){
            currVideoWrap.innerHTML = '<video playsinline loop muted preload><source src=' + source + ' type="video/mp4"></video>';
        }

        currVideo = currVideoWrap.querySelector('video');
        
        if ( isInit ){

            currVideo.load();
            currVideo.oncanplaythrough = function(){
                
                if( !initialPlay ) return;
                initialPlay = false;
    
                currVideo.currentTime = 0;
    
                if( currPoster.offsetWidth > 0 || currPoster.offsetHeight > 0 ){                
                    gsap.to(currPoster, { delay: 1, autoAlpha: 0, duration: .3, onComplete: function () { currPoster.style.display = 'none'; }, onStart: function() { currVideo.play(); } });
                }
            }

        }else {

            currVideo.currentTime = 0;

            if( currPoster.offsetWidth > 0 || currPoster.offsetHeight > 0 ){                
                gsap.to(currPoster, { delay: 1, autoAlpha: 0, duration: .3, onComplete: function () { currPoster.style.display = 'none'; }, onStart: function() { currVideo.play(); } });
            }
            
        }

    }

}



function jt_slotmachine(){

    var $slotmachine = $('.createme-how__amount-num');

    $slotmachine.each(function(){

        var $this = $(this);
        var slotmachine_number = $this.text();
        var start_offset = "top 80%";

        $this.attr( 'data-number' , slotmachine_number ).empty();

        var slotmachine_chars = slotmachine_number.split('');
        var slotmachine_array = [];
        var slotting_numbers = [0,1,2,3,4,5,6,7,8,9];

        for(var i=0 ; i<slotmachine_chars.length; i++) {
            if( $.inArray( parseInt(slotmachine_chars[i], 10) , slotting_numbers ) != -1 ) {
                $this.append('<span class="slotmachine-number-wrap"><span class="slotmachine-number--'+ slotmachine_array.length +'" data-origin="'+ slotmachine_chars[i] +'">0<br>1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9<br>0<br>1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9<br></span></span>');
                slotmachine_array[slotmachine_array.length] = parseInt(slotmachine_chars[i], 10);
            }
            else {
                $this.append('<span>'+ slotmachine_chars[i] +'</span>');
            }
        }

        var slotmachine_increment = $this.find('.slotmachine-number-wrap').outerHeight();

        ScrollTrigger.create({
            trigger: $this,
            start: start_offset,
            once: true,
            onEnter: function(){

                for(var i=0 ; i<slotmachine_array.length ; i++) {
                    gsap.fromTo( $this.find('.slotmachine-number--' + i) , (1.2 + i * 0.2) , {
                        rotation: 0.1,
                        y: slotmachine_increment
                    }, {
                        rotation: 0,
                        y: -(slotmachine_increment * (slotmachine_array[i] + 10)),
                        force3D: true,
                        ease: 'Expo.inOut',
                        onComplete: function(){
                            $(this._targets[0]).text( $(this._targets[0]).attr('data-origin') ).css('transform','translate3d(0,0,0)');
                        }
                    });
                }

            }
        });
    })

}



function single_related_slider(){

    if( !!!document.querySelector('.jt-last-post--newspress .jt-newspress-list') ){ return; }

    const sliders = document.querySelectorAll('.jt-newspress-list.swiper');

    let relatedSlider = "undefined";
    let count;

    function single_related_slider_resize(){

        sliders.forEach((item) => {

            const sliderPaging = item.parentNode.querySelector('.swiper-pagination');

            // if only child
            count = 4;

            if ( JT.isScreen(1023) ){
                count = 3;
            }
            if ( JT.isScreen(860) ){
                count = 2;
            }

            // swipe
            if( item.querySelectorAll('.swiper-slide').length > count && relatedSlider === "undefined" ) {

                item.classList.remove('jt-newspress-list--noswipe');

                relatedSlider = new Swiper(item, {
                    loop: true,
                    speed: 400,
                    slidesPerView: 'auto',
                    preventInteractionOnTransition: true,
                    followFinger: false,
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
                if( relatedSlider != "undefined" ){
                    relatedSlider.destroy();
                    relatedSlider = "undefined";
                }
                item.classList.add('jt-newspress-list--noswipe');
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

        })
    }

    single_related_slider_resize();
    window.addEventListener('resize', single_related_slider_resize );

}



function visual_sound_control() {
    // Toggle sound muted
    var sounds = document.querySelectorAll('.jt-sound');

    if (!!!sounds) return;

    sounds.forEach((sound) => {
        sound.addEventListener('click', function() {
            var curr = sound.parentElement;

            if (!!!curr) return;

            vimeo_sound_toggle(sound.classList.contains('jt-sound--on'), function() {
                if (sound.classList.contains('jt-sound--on')) {
                    sound.classList.remove('jt-sound--on');
                    sound.classList.add('jt-sound--off');
                } else {
                    sound.classList.remove('jt-sound--off');
                    sound.classList.add('jt-sound--on');
                }
            });

            function vimeo_sound_toggle(set, callback) {
                if (curr.querySelector('iframe')) {
                    var currIframe = curr.querySelector('iframe');
    
                    if (currIframe) {
                        JT.globals.jt_vimeo_ready(function() {
                            var currVideo = new Vimeo.Player(currIframe);
                            currVideo.setMuted(set);
                        });
                    }
                }
    
                callback();
            }
        })
    })
}



})();