/*
 * File       : js/script-hree.js
 * Author     : STUDIO-JT (HREE)
 * Guideline  : JTstyle.2.1
 *
 * SUMMARY:
 * 1) INIT
 * 2) Functions
 */



(function(){



/* **************************************** *
* INIT
* **************************************** */
ingredients_centella_gallery();
brandstory_motion();

// Google map init
window.initMap = offline_store_map;



/* **************************************** *
    * ON RESIZE
    * **************************************** */
// INITIALIZE RESIZE
function handleResize(){

    // setTimeout to fix IOS animation on rotate issue
    setTimeout(function(){
        ingredients_centella_gallery();
        brandstory_motion();
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
function offline_store_map() {

    const mapGoogle = document.getElementById('jt-map');
    
    if( mapGoogle != null ){

        const container = mapGoogle,
                lat       = mapGoogle.getAttribute('data-lat'),
                lng       = mapGoogle.getAttribute('data-lng'),
                zoom      = parseInt(mapGoogle.getAttribute('data-zoom')),
                desktop   = ( document.querySelector('html').classList.contains('desktop') ) ? true : false,
                addressList = document.querySelector('.stores-offline-search__list'),
                mapPosition = new google.maps.LatLng(lat, lng),
                movePosition = JT.isScreen('540') ? -40 : -60;

        let targetAddress, 
            targetName = null;

        if( addressList ){
            targetAddress = addressList.querySelector('.stores-offline-search__item').querySelector('p').innerHTML;
            targetName = addressList.querySelector('.stores-offline-search__item').querySelector('b').innerHTML;
        } 

        // Geocoder
        const geocoder = new google.maps.Geocoder();

        function getGeocode(address){
            geocoder.geocode( { 'address': address }, function(results, status) {
                if (status == 'OK') {
                    map.setCenter(results[0].geometry.location);
                    
                    marker = new google.maps.marker.AdvancedMarkerView({
                        map,
                        position : results[0].geometry.location,
                        content: markerElement,
                    });

                    map.panBy(0, movePosition);
                } else {
                    JT.alert("주소를 찾을 수 없습니다.")
                }
            });
        }

        // Init
        const map = new google.maps.Map(container, {
            center          : mapPosition,   // 지도 중심점의 좌표
            zoom            : zoom,          // 지도의 축척 레벨
            zoomControl     : desktop,       // 줌 컨트롤의 표시 여부
            scrollWheel     : false, 	     // 마우스 휠 동작으로 지도를 확대/축소할지 여부
            //gestureHandling : "none",        // 화면 이동 및 확대/축소 안내 사용 여부
            draggable       : desktop,       // 마우스로 끌어서 지도를 이동할지 여부
            mapTypeControl  : false,         // 지도 타입 변경 표시 여부
            streetViewControl: false,        // 거리뷰 사용 여부
            mapId           : '9dde330dc592ea33' 
        });

        getGeocode(targetAddress);

        // Marker
        const markerElement = document.createElement('div');

        markerElement.className = 'jt-custom-marker';
        markerElement.textContent = targetName;

        let marker = new google.maps.marker.AdvancedMarkerView({
            map,
            position : mapPosition,
            content: markerElement,
        });

        // Address change
        if( addressList ){
            addressList.addEventListener('click', function(e){

                e.preventDefault();

                if( e.target.closest('li') ){

                    marker.setMap(null);
        
                    targetName = e.target.closest('li').querySelector('b').innerHTML;
                    targetAddress = e.target.closest('li').querySelector('p').innerHTML;
                    markerElement.innerHTML = targetName;
        
                    getGeocode(targetAddress);
                    
                    if( JT.isScreen('1023') ){
                        const targetTop = document.querySelector('#header').offsetHeight + document.querySelector('.article__header').offsetHeight;
                        gsap.to(window, { duration: .4, scrollTo: targetTop, ease: 'power3.out' });
                    }
                    
                }
    
            })
        } else {
            marker.setMap(null);
        }

    }

}



function ingredients_centella_gallery(){

    if( !document.querySelector('.col-type--gallery') ){ return }

    const target = document.querySelector('.col-type--gallery .ingredients-detail-colgroup__contents');

    ScrollTrigger.matchMedia({

        "(min-width: 860px)": function() {
            gsap.to(target, {
                scrollTrigger: {
                    trigger: '.col-type--gallery',
                    pin: target,
                    start: "top top",
                    end: "bottom 80%",
                } 
            });
        }, 

    });

}




function brandstory_motion(){

    if( !document.querySelector('.brandstory-to') ){ return }

    const target = document.querySelector('.brandstory-to');

    ScrollTrigger.matchMedia({

        // desktop
        "(min-width: 1024px)": function() {

            const container = document.querySelector('.brandstory-to__inner--pc');

            // setting
            let posStart, posEnd, posTo;
    
            const posList = [
                { screen: 2560, start: '31.4vw', end: '9.6vw', to: '-19.3vw' },
                { screen: 2000, start: '33.4vw', end: '12.2vw', to: '-17.3vw' },
                { screen: 1600, start: '35.4vw', end: '13.4vw', to: '-15.9vw' },
                { screen: 1480, start: '33.1vw', end: '12.2vw', to: '-17.6vw' },
                { screen: 1200, start: '35.5vw', end: '15.2vw', to: '-15.7vw' }
            ];
    
            posList.forEach(function(pos, i){
                const isLastItem = !posList[i + 1];
                const screenWidth = window.innerWidth;
    
                if ((isLastItem && pos.screen >= screenWidth) || (!isLastItem && pos.screen >= screenWidth && screenWidth > posList[i + 1].screen)) {
                    posStart = posList[i].start;
                    posEnd = posList[i].end;
                    posTo = posList[i].to;
                }
            })

            document.querySelector('.brandstory-to__column--puri .brandstory-to__title').style.transform = `translate3d(${posStart}, 0px, 0px)`;
            document.querySelector('.brandstory-to__column--to .brandstory-to__title').style.transform = `translate3d(${posTo}, 0px, 0px)`;
            document.querySelector('.brandstory-to__title--hidden').style.width = '100%';

            // timeline
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: target,
                    pin: target,
                    start: "top top", 
                    end: "+=2400",
                },
            });
            
            // reset
            if( container.classList.contains('image-motion') ){
                container.classList.remove('image-motion');
            }
                
            // start
            tl.addLabel("step1");
            tl.to(".brandstory-to__logo--hidden", { autoAlpha: 0, delay: .3, duration: .8 }, "step1");
        
            tl.addLabel("step2");
            tl.fromTo(".brandstory-to__column--puri .brandstory-to__title", { x: posStart }, { x: posEnd, duration: .8 }, "step2");
            tl.fromTo(".brandstory-to__column--to .brandstory-to__title", { x: posTo }, { x: 0, duration: .8, }, "step2");
            tl.fromTo(".brandstory-to__title--hidden", { 'width': '0%' }, { 'width': '100%', autoAlpha: 1, duration: .8, }, "step2");

            tl.addLabel("step3");
            tl.to(".brandstory-to__title--hidden", { autoAlpha: 0 }, "step3");
            tl.fromTo(".brandstory-to__line", { height: 0 }, { 
                'height': '100vh', 
                delay: .6, 
                duration: .8, 
                onComplete: () => {
                    container.classList.add('image-motion');
    
                    document.querySelector('.brandstory-to__column--puri').classList.add('hover');
    
                    document.querySelector('.brandstory-to__column--puri').addEventListener('mouseover', function(){
                        document.querySelector('.image-motion .brandstory-to__column--puri .brandstory-to__desc').setAttribute('style','');
                        document.querySelector('.image-motion .brandstory-to__column--to .brandstory-to__desc').setAttribute('style','');
    
                        document.querySelector('.brandstory-to__column--to').classList.remove('hover');
                        this.classList.add('hover');
                    })
    
                    document.querySelector('.brandstory-to__column--to').addEventListener('mouseover', function(){
                        document.querySelector('.image-motion .brandstory-to__column--puri .brandstory-to__desc').setAttribute('style','');
                        document.querySelector('.image-motion .brandstory-to__column--to .brandstory-to__desc').setAttribute('style','');
    
                        document.querySelector('.brandstory-to__column--puri').classList.remove('hover');
                        this.classList.add('hover');

                    })
                }
            }, "step3");

            // pin remove
            window.addEventListener('scroll', function(){

                let current = document.documentElement.scrollTop;
                const target = window.pageYOffset + document.querySelector('#footer').getBoundingClientRect().top;

                if( target <= current ){
                    motl.kill();
                } 

            });
            
        }, 

        // mobile
        "(max-width: 1023px)": function() {
            
            // moblie
            let motl = gsap.timeline({
                scrollTrigger: {
                    trigger: target,
                    pin: target,
                    start: "top top", 
                    end: "+=1000", 
                    scrub: true,
                    onEnter: () => {
                        document.querySelector('.brandstory-to__process').classList.add('start');
                        
                        // move process
                        let currentScroll = 0;
                        let lastScroll    = 0;
                        let moveScroll    = 10;

                        window.addEventListener('scroll', function(){
                            currentScroll = window.scrollY;

                            // Make sure they scroll more than move scroll
                            if( Math.abs(lastScroll - currentScroll) <= moveScroll ) return;

                            if( currentScroll > lastScroll ){ // ScrollDown
                                if( currentScroll > window.innerHeight ){
                                    gsap.to('.brandstory-to__process', { duration: .2, y: 0, ease: 'power3.out' });
                                }
                            }
                            else { // ScrollUp
                                gsap.to( '.brandstory-to__process', { delay: .1, duration: .4, y: header.offsetHeight -1, ease: 'power3.out' });
                            }

                            lastScroll = currentScroll;
                        })
                    },
                    onLeaveBack: () => {
                        document.querySelector('.brandstory-to__process').classList.remove('start');
                    },
                },
            });
    
            motl.addLabel("step1");
            motl.to(".brandstory-to__slide-item:nth-child(1)", { duration: .1, autoAlpha: 1 }, "step1");
            motl.to(".brandstory-to__process-bar", { 'width': '25%' }, "step1");

            motl.addLabel("step2");
            motl.to(".brandstory-to__slide-item:nth-child(1)", { duration: .1, autoAlpha: 0 }, "step2");
            motl.to(".brandstory-to__process-bar", { 'width': '50%' }, "step2");

            motl.addLabel("step3");
            motl.to(".brandstory-to__slide-item:nth-child(2)", { duration: .1, autoAlpha: 0 }, "step3");
            motl.to(".brandstory-to__process-bar", { 'width': '75%' }, "step3");

            motl.addLabel("step4");
            motl.to(".brandstory-to__slide-item:nth-child(3)", { duration: .1, autoAlpha: 0 }, "step4");
            motl.to(".brandstory-to__process-bar", { 'width': '100%' }, "step4");

        }, 

    });

}
    
})();    