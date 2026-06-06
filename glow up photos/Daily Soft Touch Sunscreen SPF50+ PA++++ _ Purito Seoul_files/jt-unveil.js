/**
 * Image lazyload
 *
 * @version 1.0.0
 * @since 2023-06-27
 * @author STUDIO-JT (KMS)
 *
 * @example
 * new JtLazyload( document.querySelector('[data-unveil]'), 300, function(){
 *     console.log( 'completed' );
 * });
 */
class JtLazyload {

    /**
     * JtLazyload 생성
     *
     * @constructor
     * @param {HTMLElement} element - Image Element
     * @param {number} [threshold=0] - 이미지 로드 시작 시점을 지정합니다.
     * @param {function} [callback] - 이미지 로드 후 실행되는 콜백
     */
    constructor( element, threshold, callback ) {

        const _this = this;

        _this.image        = element;
        _this.threshold    = threshold || 0;
        _this.retina       = window.devicePixelRatio > 1,
        _this.attrib       = _this.retina ? 'data-unveil-retina' : 'data-unveil',
        _this.callback     = callback;
        _this.unveilMethod = _this.unveil.bind(_this);

        _this.addEvent();
        _this.unveil();

    }

    unveil() {

        const _this = this;

        if( _this.image.offsetWidth === 0 && _this.image.offsetHeight === 0 ) return false;

        const wt = window.scrollY,
              wb = wt + window.innerHeight,
              et = _this.image.getBoundingClientRect().top + wt,
              eb = et + _this.image.offsetHeight;

        if( eb >= wt - _this.threshold && et <= wb + _this.threshold ) {

            let source = _this.image.getAttribute(_this.attrib);
            source = source || _this.image.getAttribute('data-unveil');

            if (source) {

                _this.removeEvent();

                if ( !( _this.image instanceof HTMLImageElement ) ){
                    _this.image.setAttribute('style', 'background-image:url('+source+');');
                } else {
                    _this.image.setAttribute('src', source);
                }

                if ( typeof _this.callback === 'function' ) _this.callback();
                
            }
            
        }

    }

    /**
     * 이벤트 추가
     */
    addEvent() {

        window.addEventListener('scroll', this.unveilMethod, false);
        window.addEventListener('resize', this.unveilMethod, false);
        window.addEventListener('lookup', this.unveilMethod, false);

    }

    /**
     * 이벤트 삭제
     */
    removeEvent() {

        window.removeEventListener('scroll', this.unveilMethod, false);
        window.removeEventListener('resize', this.unveilMethod, false);
        window.removeEventListener('lookup', this.unveilMethod, false);

    }

}