'use strict';

/**
 * JT javascript UI library
 * @namespace
 * @description UI library create to help front end developement
 */
var JT = JT || {};

(function(win) {



    /**
     * Empty object will store all custom global of the site
     *
     * @description Sometime variables or functions need to be accessible globally.
     * Use this object to store them, it avoid potentiel conflict with third party script.
     * Please use this functionality with wisdom you avoid memory issue
     *
     * @version 1.0.0
     * @since 2018-02-12
     * @author STUDIO-JT (NICO)
     *
     * @example
     * // Add global variable :
     * JT.globals.myVar = 'somthing';
     *
     * // Add global fucntion :
     * JT.globals.myFunction = function(){
     *     // alert('something')
     * };
     */
    JT.globals = {}; 



    /**
     * 화면이 기준점보다 작은지 확인합니다.
     * Check if screen is smaller than
     *
     * @description CSS mediaqueries max-width와 동일합니다.
     * @version 1.0.0
     * @since 2018-02-12
     * @author STUDIO-JT (NICO)
     *
     * @example
     * // Basic usage :
     * JT.isScreen('768');
     */
    JT.isScreen = function( maxWidth ){

        if( win.matchMedia ) {
            return win.matchMedia('(max-width:'+ maxWidth +'px)').matches;
        } else {
            return win.innerWidth <= maxWidth;
        }
        
    };



    /**
     * userAgent정보에 키워드가 포함되어 있는지 확인합니다.
     *
     * @version 1.0.0
     * @since 2023-03-31
     * @author STUDIO-JT (KMS)
     * @requires browser-selector.js
     *
     * @param {string} value - 키워드 (클래스명)
     * @return {boolean}
     *
     * @example
     * // Basic usage :
     * JT.browser('mobile');
     */
    JT.browser = function( value ){
    
        if( document.querySelector('html').classList.contains(value) ) {
            return true;
        } else {
            return false;
        }

    };



    /**
     * JT simple confirm
     *
     * @description 취소/확인 버튼을 가질 수 있는 모달을 띄웁니다.
     * 확인버튼은 필수로 제공되며, 취소버튼은 옵션을 통해 활성화 시킬 수 있습니다.
     *
     * @version 1.0.0
     * @since 2023-01-18
     * @author STUDIO-JT (KMS)
     *
     * @param {string|object} [args] - 모달에 표시할 텍스트 문자열 혹은 옵션 오브젝트
     * @param {string} args.message - 모달에 표시할 텍스트 문자열
     * @param {boolean} [args.isChoice=false] - 취소버튼 사용 유무
     * @param {string} [args.confirm='확인'] - 확인 버튼 라벨
     * @param {string} [args.cancel='취소'] - 취소 버튼 라벨
     * @param {callback} [args.onConfirm] - 확인 버튼 콜백
     * @param {callback} [args.onCancel] - 취소 버튼 콜백
     * @param {callback} [cb] - 모달 제거 후 실행되는 콜백
     *
     * @example
     * // 기본예제 :
     * JT.confirm('Hello World');
     *
     * // 콜백예제 :
     * JT.confirm('Hello World', function(){
     *     console.log('callback');
     * });
     *
     * // 오브젝트 타입 옵션예제 :
     * JT.confirm({
     *     message     : 'Hello World',
     *     confirm     : '확인',
     *     cancel      : '취소',
     *     onConfirm   : function(){
     *         console.log('확인 callback');
     *     },
     *     onCancel    : function(){
     *         console.log('취소 callback');
     *     }
     * });
     */
    JT.confirm = function( args, cb ){

        if( typeof args !== 'object' && typeof args !== 'string' ) return;
        if( typeof cb == 'undefined' ) cb = '';

        let message, isChoice, confirm, cancel, onConfirm, onCancel;

        // String or object parameter
        if( typeof args == 'object' ){
            message   = args.message;
            onConfirm = args.onConfirm;
            onCancel  = args.onCancel;
        } else {
            message = args;
        }

        // If has on_confirm callback second parameter (TODO : improve the parameter check logic)
        if( typeof cb == 'function' && typeof args != 'object' ){
            onConfirm = cb;
        }

        // Set default value
        isChoice = ( typeof args.isChoice != 'undefined' ) ? args.isChoice : false;
        confirm = ( typeof args.confirm != 'undefined' ) ? args.confirm : '확인';
        cancel = ( typeof args.cancel != 'undefined' ) ? args.cancel : '취소';

        // Get a unique id
        const now  = new Date().getTime();
        const uid  = now / 1000 | 0;
        const id   = 'jt-confirm--' + uid;

        // Defined class
        let confirmClass = 'jt-confirm';
        if( isChoice ) confirmClass += ' jt-confirm--choice';

        // Add element
        let html = document.createElement('div');
            html.setAttribute('id', id);
            html.setAttribute('class', confirmClass);
            html.setAttribute('role', 'alert');

        html.innerHTML = `<div class="jt-confirm__container">
                              <div class="jt-confirm__content">
                                  <p>${message}</p>
                              </div>
                              <div class="jt-confirm__actions">
                                  ${isChoice ? '<button class="jt-confirm__btn jt-confirm--cancel">'+ cancel +'</button>' : ''}
                                  <button class="jt-confirm__btn jt-confirm--success">${confirm}</button>
                              </div>
                          </div>`;
        

        // Append element
        document.querySelector('body').appendChild(html);

        // A11y - focus
        html.querySelector('.jt-confirm--success').setAttribute('tabindex', 0);
        html.querySelector('.jt-confirm--success').focus();

        // Callback
        html.querySelector('.jt-confirm--success').addEventListener('click', function(e){
            e.preventDefault();
            html.remove();
            if( typeof onConfirm === 'function' ) onConfirm();
        });

        if( isChoice ){
            html.querySelector('.jt-confirm--cancel').addEventListener('click', function(e){
                e.preventDefault();
                html.remove();
                if( typeof onCancel === 'function' ) onCancel();
            });
        }

        // ESC keyevent 연동
        const esc = function(e){
            if ( e.which == '27' ) {
                html.remove();
            }
        };
        document.removeEventListener('keyup', esc);
        document.addEventListener('keyup', esc);

    };



    /**
     * Custom Alert helper
     *
     * @version 1.2.0
     * @since 2018-02-12
     * @author STUDIO-JT (NICO)
     *
     * @param {object} args - Alert 옵션 오브젝트
     * @param {string} [args.theme=basic] - 미리 정의 된 스타일은 "basic", "classic"이며 원하는 클래스 이름을 추가하여 확장 할 수 있습니다
     * @param {string} [args.type=none] - 미리 정의 된 스타일은 "info", "success", "error"이며 원하는 클래스 이름을 추가하여 확장 할 수 있습니다
     * @param {boolean} [args.hasIcon=false] - 알림 메세지의 상태를 나타내는 아이콘을 메세지 상단에 추가합니다
     * @param {boolean} [args.isConfirm=false] - 컨펌 타입 Alert 출력 (취소버튼 추가)
     * @param {string} [args.message=false] - 알림 메시지 내용
     * @param {string} [args.title=false] - 알림 메시지 제목
     * @param {boolean} [args.titleHighlight=false] - 확장된 제목 스타일을 제공합니다
     * @param {boolean} [args.buttonHighlight=false] - 확장된 버튼 스타일을 제공합니다
     * @param {boolean} [args.buttonIcon=false] - 버튼에 고유 아이콘을 추가합니다
     * @param {string} [args.confirm=확인] - 확인 버튼 라벨
     * @param {string} [args.cancel=취소] - 취소 버튼 라벨
     * @param {callback} [args.onConfirm] - 확인 버튼 콜백
     * @param {callback} [args.onCancel] - 취소 버튼 콜백
     *
     * @todo create custom ui
     *
     * @example
     * JT.alert({
     *     theme           : 'basic',
     *     type            : 'error',
     *     hasIcon         : true,
     *     isConfirm       : true,
     *     message         : '같은 문제가 지속되면 관리자에게 연락바랍니다.',
     *     title           : '저장에 실패했습니다.',
     *     titleHighlight  : false,
     *     buttonHighlight : false,
     *     buttonIcon      : true,
     *     confirm         : '확인',
     *     cancel          : '취소',
     *     onConfirm       : function(){
     *         console.log('확인 callback');
     *     },
     *     onCancel        : function(){
     *         console.log('취소 callback');
     *     }
     * });
     */
    JT.alert = function( args ){

        if( typeof args !== 'object' ) return;

        let theme, type, hasIcon, isConfirm, message, title, titleHighlight, buttonHighlight, buttonIcon, confirm, cancel, onConfirm, onCancel;

        // Set default value
        theme = ( typeof args.theme != 'undefined' ) ? args.theme : 'basic';
        type = ( typeof args.type != 'undefined' ) ? args.type : 'none';
        hasIcon = ( typeof args.hasIcon != 'undefined' && args.hasIcon && type != 'none' ) ? true : false;
        isConfirm = ( typeof args.isConfirm != 'undefined' ) ? args.isConfirm : false;
        message = ( typeof args.message != 'undefined' ) ? args.message : false;
        title = ( typeof args.title != 'undefined' ) ? args.title : false;
        titleHighlight = ( typeof args.titleHighlight != 'undefined' && !!title && !hasIcon ) ? args.titleHighlight : false;
        buttonHighlight = ( typeof args.buttonHighlight != 'undefined' && !isConfirm ) ? args.buttonHighlight : false;
        buttonIcon = ( typeof args.buttonIcon != 'undefined' ) ? args.buttonIcon : false;
        confirm = ( typeof args.confirm != 'undefined' ) ? args.confirm : '확인';
        cancel = ( typeof args.cancel != 'undefined' ) ? args.cancel : '취소';
        onConfirm = args.onConfirm;
        onCancel = args.onCancel;

        // Get a unique id
        const now  = new Date().getTime();
        const uid  = now / 1000 | 0;
        const id   = 'jt-alert--' + uid;

        // Defined class
        let alertClass = 'jt-alert jt-alert--theme-' + theme + ' jt-alert--type-' + type;

        if( titleHighlight ) alertClass += ' jt-alert--title-highlight';
        if( buttonHighlight ) alertClass += ' jt-alert--button-highlight';
        if( buttonIcon ) alertClass += ' jt-alert--button-icon';
        if( hasIcon ) alertClass += ' jt-alert--icon';
        if( isConfirm ) alertClass += ' jt-alert--confirm';
        if( buttonHighlight && !isConfirm && !hasIcon ) alertClass += ' jt-alert--reverse';

        // Add element
        let html = document.createElement('div');
            html.setAttribute('id', id);
            html.setAttribute('class', alertClass);
            html.setAttribute('role', 'alert');

        html.innerHTML = `<div class="jt-alert__container">
                              <div class="jt-alert__content">
                                  ${title ? '<h1>'+ title +'</h1>' : ''}
                                  ${message ? '<p>'+ message +'</p>' : ''}
                              </div>
                              <div class="jt-alert__actions">
                                  ${isConfirm ? '<button class="jt-alert__btn jt-alert__btn--cancel"><span class="jt-alert__btn-label">'+ cancel +'</span></button>' : ''}
                                  <button class="jt-alert__btn jt-alert__btn--confirm"><span class="jt-alert__btn-label">${confirm}</span></button>
                              </div>
                          </div>`;
        
        if( hasIcon ) {
            // Create SVG
            let svg = '';

            switch ( type ) {
                case 'info':
                    svg = '<svg width="45" height="45" viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M22.5,2C33.8,2,43,11.2,43,22.5S33.8,43,22.5,43S2,33.8,2,22.5S11.2,2,22.5,2 M22.5,0C10.1,0,0,10.1,0,22.5S10.1,45,22.5,45 S45,34.9,45,22.5S34.9,0,22.5,0L22.5,0z M23.5,12.8h-2V28h2V12.8z M23.5,29.8h-2v2.4h2V29.8z"/></svg>';
                    break;
                case 'success':
                    svg = '<svg width="45" height="45" viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M22.5,2C33.8,2,43,11.2,43,22.5S33.8,43,22.5,43S2,33.8,2,22.5S11.2,2,22.5,2 M22.5,0C10.1,0,0,10.1,0,22.5S10.1,45,22.5,45 S45,34.9,45,22.5S34.9,0,22.5,0L22.5,0z M33.2,17.5L31.9,16L19.3,26.9c-1.7-1.8-5.9-6.4-6.1-6.6l-1.4,1.4c0.2,0.2,4.1,4.5,6.7,7.3 l0.7,0.7L33.2,17.5z"/></svg>';
                    break;            
                case 'error':
                    svg = '<svg width="45" height="45" viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M30.2,16.2l-6.3,6.3l6.3,6.3l-1.4,1.4l-6.3-6.3l-6.3,6.3l-1.4-1.4l6.3-6.3l-6.3-6.3l1.4-1.4l6.3,6.3l6.3-6.3L30.2,16.2z M45,22.5C45,34.9,34.9,45,22.5,45S0,34.9,0,22.5S10.1,0,22.5,0S45,10.1,45,22.5z M43,22.5C43,11.2,33.8,2,22.5,2S2,11.2,2,22.5 S11.2,43,22.5,43S43,33.8,43,22.5z"/></svg>';
                    break;            
                default:
                    break;
            }

            svg = new DOMParser().parseFromString(svg, 'image/svg+xml');

            // Create icon element
            let icon = document.createElement('i');
                icon.setAttribute('class', 'jt-alert__icon');
                icon.appendChild(svg.querySelector('svg'));
            
            html.querySelector('.jt-alert__content').prepend(icon);
        }

        if( buttonIcon ) {
            // Confirm
            const confirmSvg = new DOMParser().parseFromString('<svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg"><path d="M5.1,11.1l-0.6-0.7C3.1,9,1,6.8,0.8,6.7l1.4-1.4c0.1,0.1,2,2,3.1,3.2l6.6-5.4l1.3,1.5L5.1,11.1z"/></svg>', 'image/svg+xml');

            let confirmIcon = document.createElement('i');
                confirmIcon.setAttribute('class', 'jt-alert__btn-icon');
                confirmIcon.appendChild(confirmSvg.querySelector('svg'));
            
            html.querySelector('.jt-alert__btn--confirm').prepend(confirmIcon);

            // Cancel
            if( isConfirm ) {
                const cancelSvg = new DOMParser().parseFromString('<svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg"><path d="M8.4,7l4.8,4.8l-1.4,1.4L7,8.4l-4.8,4.8l-1.4-1.4L5.6,7L0.8,2.2l1.4-1.4L7,5.6l4.8-4.8l1.4,1.4L8.4,7z"/></svg>', 'image/svg+xml');

                let cancelIcon = document.createElement('i');
                    cancelIcon.setAttribute('class', 'jt-alert__btn-icon');
                    cancelIcon.appendChild(cancelSvg.querySelector('svg'));

                html.querySelector('.jt-alert__btn--cancel').prepend(cancelIcon);
            }
        }

        // Append element
        document.querySelector('body').appendChild(html);

        // A11y - focus
        html.querySelector('.jt-alert__btn--confirm').setAttribute('tabindex', 0);
        html.querySelector('.jt-alert__btn--confirm').focus();

        // Callback
        html.querySelector('.jt-alert__btn--confirm').addEventListener('click', function(e){
            e.preventDefault();
            html.remove();
            if( typeof onConfirm === 'function' ) onConfirm();
        });

        if( isConfirm ){
            html.querySelector('.jt-alert__btn--cancel').addEventListener('click', function(e){
                e.preventDefault();
                html.remove();
                if( typeof onCancel === 'function' ) onCancel();
            });
        }

        // ESC keyevent 연동
        const esc = function(e){
            if ( e.which == '27' ) {
                html.remove();
            }
        };
        document.removeEventListener('keyup', esc);
        document.addEventListener('keyup', esc);

    };



    /**
     * Loading mini modal
     *
     * @description Loading  modal component 
     *
     * @version 1.0.0
     * @since 2021-12-14
     * @author STUDIO-JT (NICO)
     *
     * @example
     * // 로딩 열기
     * JT.loading.show();
     *
     * // 로딩 닫기
     * JT.loading.hide();
     */
    JT.loading = {
        show : function(message){
            message = typeof message === 'undefined' ? '로딩중' : message;

            if( document.getElementsByClassName('jt-alert-loading').length <= 0 ) {
                let html = document.createElement('div');
                    html.setAttribute('class', 'jt-alert-loading');
                
                html.innerHTML = `<div class="jt-alert-loading__container">
                                      <div class="jt-alert-loading__content">
                                          <h1 class="jt-alert-loading__message">${message}</h1>
                                          <div class="jt-alert-loading__progress">
                                              <div class="jt-alert-loading__progress-icon"></div>
                                              <div class="jt-alert-loading__progress-icon"></div>
                                              <div class="jt-alert-loading__progress-icon"></div>
                                          </div> 
                                      </div> 
                                  </div>`;                    
                
                document.querySelector('body').appendChild(html);
            } else {
                document.querySelector('.jt-alert-loading__message').innerText = message;
            }
        },
        remove : function(){
            document.querySelector('.jt-alert-loading').remove();
        }		
    };



    /**
     * Destroy or restore scroll mousewheel
     *
     * @version 1.0.0
     * @since 2020-07-14
     * @author STUDIO-JT (NICO, KMS)
     *
     * @example
     * // 스크롤 비활성화 :
     * JT.scroll.destroy();
     *
     * // 스크롤 활성화 :
     * JT.scroll.restore();
     */
    JT.scroll = {
        // window scroll event on/off
        destroy : function(){
            if( this.supportPassive() ){
                window.addEventListener('wheel', this.disabledEvent, {passive: false});
            } else {
                window.addEventListener('mousewheel', this.disabledEvent);
                window.addEventListener('DOMMouseScroll', this.disabledEvent);
            }
        },

        restore : function(){
            if( this.supportPassive() ){
                window.removeEventListener('wheel', this.disabledEvent);
            } else {
                window.removeEventListener('mousewheel', this.disabledEvent);
                window.removeEventListener('DOMMouseScroll', this.disabledEvent);
            }
        },

        // scroll passive mode check
        supportPassive : function(){
            var supportsPassive = false;
            try {
                document.addEventListener('test', null, { get passive() { supportsPassive = true }});
            } catch(e) {}

            return supportsPassive;
        },

        // disabled scroll
        disabledEvent : function(event){
            event.preventDefault();
        }
    };



    /**
     * Cookies helper
     *
     * @Crud your cookies
     *
     * @version 1.0.0
     * @since 2019-04-04
     * @author STUDIO-JT (NICO)
     * @see {@link https://www.quirksmode.org/js/cookies.html}
     *
     * @example
     * // Cookie 추가 (7일) :
     * JT.cookies.create('myCookieId','Cookie 내용',7);
     *
     * // Cookie 읽기 :
     * JT.cookies.read('myCookieId');
     *
     * // Cookie 삭제 :
     * JT.cookies.destroy('myCookieId');
     */
    JT.cookies = {

        create : function( name, value, days ) {
            let expires = '';
            if ( days ) {
                const date = new Date();
                date.setTime(date.getTime()+(days*24*60*60*1000));
                expires = '; expires='+date.toGMTString();
            }
            document.cookie = name+'='+value+expires+'; path=/';
        },

        read : function( name ) {
            const nameEQ = name + '=';
            const ca = document.cookie.split(';');
            for( let i=0 ; i < ca.length ; i++ ) {
                let c = ca[i];
                while ( c.charAt(0)==' ' ) c = c.substring(1,c.length);
                if ( c.indexOf(nameEQ) == 0 ) return c.substring(nameEQ.length,c.length);
            }
            return null;
        },

        destroy : function( name ) {
            JT.cookies.create(name, '', -1);
        }

    };



    /**
     * History manager
     *
     * @version 1.0.0
     * @since 2020-07-09
     * @author STUDIO-JT (NICO)
     *
     * @example
     * // Pop up
     * function popupInit(){
     *
     *   // Open event
     *   document.querySelector('.open').addEventListener('click', function(e){
     *
     *     e.preventDefault();
     *     popupOpen();
     *     JT.history.add('popup01');
     *
     *   });
     *
     *   // Close event
     *   document.querySelector('.close').addEventListener('click', function(e){
     *
     *     e.preventDefault();
     *     popupClose();
     *     JT.history.remove('popup01');
     *
     *   });
     *
     *   // Back/forward event (if history change)
     *   JT.history.listen('popup01', popupOpen, popupClose);
     *
     *   // Open - close closures
     *   function popupOpen(){
     *     // popup open code
     *   }
     *
     *   function popupClose(){
     *     // popup hide code
     *   }
     *
     * }
     *
     * // Tab example : Hash 사용
     * function tabInit(){
     *
     *   JT.history.listen('tab', tabOpen, tabClose, true);
     *
     *   if(location.hash != ''){
     *     tabClose();
     *     tabOpen(location.hash);
     *   }
     *
     *   // Open - close
     *   function tabOpen(id){
     *     // tab show code
     *   }
     *
     *   function tabClose(){
     *     // tab hide code
     *   }
     *
     * }
     */
    JT.history = {

        // pushstate after open the popup
        add : function(uid){
            if ('history' in window && 'pushState' in history) {
                var pushObj = {};
                pushObj['jt-'+uid] = 'show';
                history.pushState(pushObj, null, location.href);
            }
        },

        // Remove the current history on click close btn
        // Todo : check only history state  is popup show
        remove : function(uid){
            if(history.state != null && history.state['jt-'+uid] == 'show'){
                history.back(); // the magic remove state by spidoche (old school functions are good)
            }
        },

        // Listen back/forward btn click
        listen : function(uid,open,close,hash){

            // set default value
            if(typeof hash == 'undefined'){
                hash = false;
            }

            // Hash mode
            if(hash){

                window.addEventListener('hashchange', function(e){

                    close();
                    open(location.hash);

                });
                window.addEventListener

            // PopState mode
            } else if ('PopStateEvent' in window) {
                
                window.addEventListener('popstate', function(e){

                    if(e.state != null && e.state['jt-'+uid] == 'show'){
                        // forward button
                        if(typeof open === 'function'){
                            open();
                        }
                    }else{
                        // back button
                        if(typeof close === 'function'){
                            close();
                        }

                        // remove forward if not need
                        if(typeof open !== 'function'){

                            // Clean forwar history
                            //history.forward();

                        }
                    }

                }, false);

            }
        }
    };



    /**
     * UI Helper
     *
     * @description UI 관련 함수 관리용 헬퍼
     *
     * @version 1.0.0
     * @since 2018-04-12
     * @author STUDIO-JT (201)
     *
     * @example
     * // 등록된 모든 함수 실행하기
     * JT.ui.init();
     *
     * // 함수 등록하기
     * JT.ui.add( function () {
     *     // alert('something')
     * };
     * JT.ui.add( test_func );
     * function test_func () {
     *     // alert( 'somethid' );
     * };
     *
     * // 함수명(string) 으로 삭제하기
     * JT.ui.del( func_name );
     * JT.ui.del( 'test_func' );
     *
     * // 함수명(string)으로 함수 가져오기
     * JT.ui.get( func_name );
     * JT.ui.get( 'test_func' );
     *
     * // 함수명(string)으로 함수 실행하기
     * JT.ui.call( func_name );
     * JT.ui.call( 'test_func' );
     *
     * // 익명함수는 func_{timestamp} 로 추가됨
     */
    JT.ui = {

        list: {},

        init: function () {

            try {

                for ( let func_name in this.list ) {

                    if ( typeof this.list[ func_name ] === 'function' ) {

                        this.list[ func_name ].call();

                    }

                }

            } catch ( e ) {

                console.log( e );

            }

        },

        add: function ( func, exec_flag ) {

            try {

                if ( typeof func === 'function' ) {

                    const func_name = ( ! func.name ? func.toString().match(/^function\s*([^\s(]+)/)[1] : func.name );

                    this.list[ func_name ] = func;

                    if ( typeof exec_flag !== 'undefined' && exec_flag === true ) {

                        func.call();

                    }

                }

            } catch ( e ) {

                console.log( e );

            }

        },

        del: function ( func_name ) {

            try {

                delete this.list[ func_name ];

            } catch ( e ) {

                console.log( e );

            }

        },

        replace: function ( func_name, func ) {

            try {

                if ( typeof func === 'function' ) {

                    this.list[ func_name ] = func;

                }

            } catch ( e ) {

                console.log( e );

            }

        },

        get: function ( func_name ) {

            try {

                return this.list[ func_name ];

            } catch ( e ) {

                console.log( e );
                return null;

            }

        },

        call: function ( func_name ) {

            try {

                this.list[ func_name ].call();

            } catch ( e ) {

                console.log( e );

            }

        }

    };


    
    /**
     * 조사 Helper
     *
     * @description 을/를, 은/는 등 조사를 가져오는 헬퍼
     *
     * @version 1.0.0
     * @since 2021-01-20
     * @author STUDIO-JT (201)
     * @see https://github.com/e-/Josa.js/
     *
     * @example
     * JT.josa( '사과', '을/를' ); // return '를'
     * JT.josa( '사과', '을' ); // return '를'
     * JT.josa( '사과', '를' ); // return '를'
     * JT.josa( '사과', '을를' ); // return '를'
     */
    JT.josa = function ( word, format, join ) {

        const _f = [
            function ( string ) { return _hasJong(string) ? '을' : '를'; }, //을/를 구분
            function ( string ) { return _hasJong(string) ? '은' : '는'; }, //은/는 구분
            function ( string ) { return _hasJong(string) ? '이' : '가'; }, //이/가 구분
            function ( string ) { return _hasJong(string) ? '과' : '와'; }, //와/과 구분
            function ( string ) { return _hasJong(string) ? '으로' : '로'; } //으로/로 구분
        ];

        const _formats = {
            '을/를'     : _f[0],
            '을'        : _f[0],
            '를'        : _f[0],
            '을를'      : _f[0],
            '은/는'     : _f[1],
            '은'        : _f[1],
            '는'        : _f[1],
            '은는'      : _f[1],
            '이/가'     : _f[2],
            '이'        : _f[2],
            '가'        : _f[2],
            '이가'      : _f[2],
            '와/과'     : _f[3],
            '와'        : _f[3],
            '과'        : _f[3],
            '와과'      : _f[3],
            '으로/로'   : _f[4],
            '으로'      : _f[4],
            '로'        : _f[4],
            '으로로'    : _f[4]
        }


        if ( typeof _formats[ format ] === 'undefiend' ) throw 'Invalid format';

        return ( join ? word : '' ) + _formats[ format ]( word );

        function _hasJong( string ) { //string의 마지막 글자가 받침을 가지는지 확인

            return ( string.charCodeAt( string.length - 1 ) - 0xac00 ) % 28 > 0;

        }

    }


    
    /**
     * Task Helper
     *
     * @description 비동기 처리를 동기로 처리하기 위한 Task 헬퍼
     *
     * @version 1.0.0
     * @since 2021-12-10
     * @author STUDIO-JT (201)
     * @see https://medium.com/@griffinmichl/asynchronous-javascript-queue-920828f6327
     *
     * @example
     * var task = JT.task();
     * task.push( done => { setTimeout( () => { console.log( 'test - 1' ); done(); }, 150 } );
     * task.push( done => { setTimeout( () => { console.log( 'test - 2' ); done(); }, 50 } );
     * task.push( done => { setTimeout( () => { console.log( 'test - 3' ); done(); }, 100 } );
     * task.run();
     *
     * // Will Return
     * test - 1
     * test - 2
     * test - 3
     */
    JT.task = function () {

        let taskQueue = [];

        function enqueueTask( task ) {
            return taskQueue.push( task );
        }

        function runTask() {
            let task = taskQueue.shift();
            task( function () {
                if ( taskQueue.length > 0 ) {
                    runTask();
                }
            } );
        }

        return {
            push: enqueueTask,
            run: runTask
        }

    }

    

    /**
     * Input validation
     *
     * @version 1.0.0
     * @since 2023-04-05
     * @author STUDIO-JT (KMS)
     *
     * @description form 태그에 novalidate 애트리뷰트가 함께 제공되어야 합니다. (The form tag must be provided with the novalidate attribute.)
     *
     * @param {element} element - Input 엘리먼트 (validation target)
     * @param {string} wrapSelector='.jt-form__data' - Input 컨테이너 클래스
     * @param {string} validSelector='.jt-form__valid' - Validation 메세지가 출력될 엘리먼트
     * @return {boolean}
     *
     * @example
     * // HTML
     * <form novalidate>
     * </form>
     *
     * // Basic usage :
     * JT.validation(input[type="text"]);
     * JT.validation(input[type="text"], '.jt-form__data'. '.jt-form__valid');
     */
    JT.validation = function( element, wrapSelector, validSelector ) {

        const field     = element;
        const container = ( typeof wrapSelector == 'undefined' ) ? field.closest('.jt-form__data') : field.closest(wrapSelector);
        const validTip  = ( typeof wrapSelector == 'undefined' ) ? container.querySelector('.jt-form__valid') : container.querySelector(validSelector);
        const dataset   = field.dataset;
        let isValid     = true;

        if( !!!container || !!!validTip ) {
            if( !!!container ) console.warn('유효성 검사를 위한 요소를 확인해주세요. undefined ' + field.getAttribute('id') + ' container');
            if( !!!validTip ) console.warn('유효성 검사를 위한 요소를 확인해주세요. undefined ' + field.getAttribute('id') + ' valid element');
            return;
        }

        if( !field.validity.valid ) {

            if( field.validity.valueMissing ) { // Required message

                if( 'msgRequired' in dataset ) {
                    validTip.textContent = dataset.msgRequired;
                } else {
                    validTip.textContent = '필수항목을 입력해 주세요.';
                }  

            } else if( field.validity.typeMismatch || field.validity.patternMismatch ) { // Invalid message
                
                if( 'msgInvalid' in dataset ) {
                    validTip.textContent = dataset.msgInvalid;
                } else {
                    validTip.textContent = '정확한 형식으로 기재해 주세요.';
                } 

            } else if( field.validity.tooLong ) {

                validTip.textContent = '최대 허용 길이보다 깁니다.';

            } else if( field.validity.tooShort ) {
                
                validTip.textContent = '최소 허용 길이보다 짧습니다.';

            }

            // Add error class
            container.classList.add('jt-form__data--error');

            // Flag
            isValid = false;

        } else {

            validTip.textContent = '';
            
            // Remove error class
            container.classList.remove('jt-form__data--error');
        
        }

        return isValid;

    }



    /**
     * GSAP killChildTweensOf helper
     * Because killChildTweensOf has been removed in gsap 3
     * https://greensock.com/forums/topic/22033-killchildtweensof-replacement/?do=findComment&comment=103903
     *
     * @version 1.0.0
     * @since 2022-02-10
     * @author STUDIO-JT (NICO)
     *
     * @example
     * JT.killChildTweensOf(document.getElementById('main'));
     */
    JT.killChildTweensOf = function( parent, complete ) {

        let parents = gsap.utils.toArray(parent),
            i = parents.length,
            _isDescendant = function(element) {
                while (element) {
                    element = element.parentNode;
                    if (element === parent) {
                        return true;
                    }
                }
            },
            j, tweens, targets;
        if (i > 1) {
            while (--i > -1) {
                killChildTweensOf(parents[i], complete);
            }
            return;
        }
        parent = parents[0];
        tweens = gsap.globalTimeline.getChildren(true, true, false);
        for (i = 0; i < tweens.length; i++) {
            targets = tweens[i].targets();
            j = targets.length;
            for (j = 0; j < targets.length; j++) {
                if (_isDescendant(targets[j])) {
                    if (complete) {
                        tweens[i].totalProgress(1);
                    }
                    tweens[i].kill();
                }
            }
        }

    }



    /**
     * JT Slide Up, Down and Toggle
     *
     * @version 1.0.0
     * @since 2023-04-05
     * @author STUDIO-JT (KMS)
     *
     * @param {element} selector - 슬라이드 타겟 엘리먼트
     * @param {number} duration=500 - 모션속도
     * @param {callback} callback=undefined - 모션 완료후 실행되는 콜백
     *
     * @example
     * // Basic usage :
     * JT.slide.up( document.querySelector('.item') );
     * JT.slide.down( document.querySelector('.item') );
     * JT.slide.toggle( document.querySelector('.item') );
     *
     * // Callback :
     * JT.slide.toggle( document.querySelector('.item'), 500, function(){
     *   // console.log('callback');
     * });
     */
    JT.slide = {
        
        up: function( selector, duration=500, callback=undefined ) {

            selector.style.transitionProperty = 'height, margin, padding';
            selector.style.transitionDuration = duration + 'ms';
            selector.style.boxSizing          = 'border-box';
            selector.style.height             = selector.offsetHeight + 'px';
            selector.offsetHeight;
            selector.style.overflow           = 'hidden';
            selector.style.height             = 0;
            selector.style.paddingTop         = 0;
            selector.style.paddingBottom      = 0;
            selector.style.marginTop          = 0;
            selector.style.marginBottom       = 0;

            window.setTimeout( () => {
                selector.style.display = 'none';
                selector.style.removeProperty('height');
                selector.style.removeProperty('padding-top');
                selector.style.removeProperty('padding-bottom');
                selector.style.removeProperty('margin-top');
                selector.style.removeProperty('margin-bottom');
                selector.style.removeProperty('overflow');
                selector.style.removeProperty('transition-duration');
                selector.style.removeProperty('transition-property');

                if( typeof callback === 'function' ) {
                    callback();
                }
            }, duration);

        },

        down: function( selector, duration=500, callback=undefined ) {

            selector.style.removeProperty('display');
            let display = window.getComputedStyle(selector).display;
            if ( display === 'none' ) display = 'block';
            selector.style.display = display;
            
            const height = selector.offsetHeight;

            selector.style.overflow           = 'hidden';
            selector.style.height             = 0;
            selector.style.paddingTop         = 0;
            selector.style.paddingBottom      = 0;
            selector.style.marginTop          = 0;
            selector.style.marginBottom       = 0;
            selector.offsetHeight;
            selector.style.boxSizing          = 'border-box';
            selector.style.transitionProperty = 'height, margin, padding';
            selector.style.transitionDuration = duration + 'ms';
            selector.style.height             = height + 'px';
            selector.style.removeProperty('padding-top');
            selector.style.removeProperty('padding-bottom');
            selector.style.removeProperty('margin-top');
            selector.style.removeProperty('margin-bottom');

            window.setTimeout( () => {
                selector.style.removeProperty('height');
                selector.style.removeProperty('overflow');
                selector.style.removeProperty('transition-duration');
                selector.style.removeProperty('transition-property');

                if( typeof callback === 'function' ) {
                    callback();
                }
            }, duration);

        },

        toggle: function( selector, duration=500, callback=undefined ) {
            
            if ( window.getComputedStyle(selector).display === 'none' ) {
                this.down(selector, duration, callback);
            } else {
                this.up(selector, duration, callback);
            }

        }

    }



    /**
     * JT offset
     *
     * @version 1.0.0
     * @since 2023-04-05
     * @author STUDIO-JT (KMS)
     *
     * @param {element} selector - offset 대상 엘리먼트
     * @return {number} offset 데이터
     *
     * @example
     * // Basic usage :
     * JT.offset.top('.item');
     * JT.offset.left('.item');
     */
    JT.offset = {

        top: function( selector ){

            const rect = document.querySelector(selector).getBoundingClientRect();
            return rect.top + window.scrollY;

        },

        left: function( selector ){

            const rect = document.querySelector(selector).getBoundingClientRect();
            return rect.left + window.scrollX;

        }

    }
    


})(window);