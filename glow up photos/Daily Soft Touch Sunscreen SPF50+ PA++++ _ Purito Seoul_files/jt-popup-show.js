/*
 * File : js/jt-popup.js
 * Author : STUDIO-JT (KMS)
 * Guideline: JTstyle.1.1
 *
 * SUMMARY:
 * 1)
 */

window.JT_BAD_UX_POPUP = {};

jQuery( function ( $ ) {
    window.JT_BAD_UX_POPUP.init = function () {
        var $container = $( '#jt_popup_container' );
        var $popup_group = $( '#jt_popup_playground' );
        var $overlay = $( '#jt_popup_overlay' );
        var is_mobile = $( 'html' ).hasClass( 'mobile' ) || $( 'html' ).hasClass( 'tablet' ) ;
        var popup_count = 0; // Popup Number
        var language = $( 'html' ).attr( 'lang' ) ;
        var home_url = '';

        is_mobile = is_mobile || ( ! is_mobile && navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test( navigator.platform ) );

        try {
            home_url = ( window.__JTPOP.home_url || '' );
        } catch ( e ) { }

        $.ajax( {
            url: home_url + '/wp-json/jt-bad-ux-popup/list/',
            method: 'get',
            data: {
                type: ( is_mobile ? 'mobile' : 'pc' ),
                location: location.href,
                language: ( typeof window.__JTPOP.language !== 'undefined' ? window.__JTPOP.language : language ),
                is_home : ( typeof window.__JTPOP.is_home !== 'undefined' ? window.__JTPOP.is_home : $( 'body' ).hasClass( 'home' ) ),
                blog_id : ( typeof window.__JTPOP.blog_id !== 'undefined' ? window.__JTPOP.blog_id : null )
            },
            success: function ( res ) {
                if ( res && typeof res.html !== 'undefined' ) {
                    $( 'body' ).append( res.html );

                    $container = $( '#jt_popup_container' );
                    $popup_group = $( '#jt_popup_playground' );
                    $overlay = $( '#jt_popup_overlay' );

                    run();
                }
            },
            error : function ( res ) {
                $.ajax( {
                    url: home_url + '/wp-admin/admin-ajax.php',
                    method: 'get',
                    data: {
                        action: 'jt_bad_ux_popup',
                        type: ( is_mobile ? 'mobile' : 'pc' ),
                        location: location.href,
                        language: ( typeof window.__JTPOP.language !== 'undefined' ? window.__JTPOP.language : language ),
                        is_home : ( typeof window.__JTPOP.is_home !== 'undefined' ? window.__JTPOP.is_home : $( 'body' ).hasClass( 'home' ) ),
                        blog_id : ( typeof window.__JTPOP.blog_id !== 'undefined' ? window.__JTPOP.blog_id : null )
                    },
                    success: function ( res ) {
                        if ( res && typeof res.html !== 'undefined' ) {
                            $( 'body' ).append( res.html );

                            $container = $( '#jt_popup_container' );
                            $popup_group = $( '#jt_popup_playground' );
                            $overlay = $( '#jt_popup_overlay' );

                            run();
                        }
                    }
                } );
            }
        } );

        function run() {
            // Popup Cookie Check
            $( '.jt_popup_item' ).each( function () {
                if ( $.cookie( $( this ).attr( 'id' ) ) == 'today_none' ) {
                    $( this ).remove();
                } else {
                    popup_count++;
                }
            } );

            // Start Device PC Popup
            if ( is_mobile == false ) {
                $( '.jt_popup_item' ).each( function () {
                    var $this = $( this );

                    $this.imagesLoaded( function () {
                        // Single Popup (Only One)
                        if ( popup_count == 1 && ! parseInt( $( '.jt_popup_item' ).css( 'left' ).replace( 'px', '' ) ) && ! parseInt( $( '.jt_popup_item' ).css( 'top' ).replace( 'px', '' ) ) ) {
                            $( '.jt_popup_item' ).css( {
                                'position': 'fixed',
                                'margin-top': - ( $( '.jt_popup_item' ).height() / 2 ) + 'px',
                                'margin-left': - ( $( '.jt_popup_item' ).width() / 2 ) + 'px',
                                'top': '50%',
                                'left': '50%'
                            } );
                        }

                        // Show Popup
                        if ( ! $overlay.is( ':visible' ) ) {
                            $overlay.fadeIn( 'fast' );
                        }

                        $this.fadeIn( 'fast' );

                        // Popup Drag - jQuery UI
                        $this.draggable( {
                            start: function ( event, ui ) {
                                var popupZIndex = 0;

                                $( '.jt_popup_item' ).each( function () {
                                    popupZIndex = ( popupZIndex < parseInt( $( this ).css( 'z-index' ) ) ? parseInt( $( this ).css( 'z-index' ) ) : popupZIndex );
                                } );

                                $this.css( 'z-index', popupZIndex + 1 );
                            }
                        } );
                    } );
                } );

                // Custom Cursor & Close All Popup
                $overlay.on( 'click', function () { // Close All
                    $container.fadeOut( 'fast', function () {
                        $( this ).remove();
                    } );
                } );
            }
            // End Device PC Popup

            // Start Device Mobile Popup
            if ( is_mobile == true ) {
                if ( $( '.jt_popup_item' ).length > 0 ) {
                    // Scroll Remove
                    $( 'body' ).addClass( 'bad_ux_popup_scroll_remove' );

                    // Overlay Height 100%
                    window.scroll( function () {
                        $overlay.height( window.innerHeight );
                    } );

                    // Two Or More slide
                    if ( $( '.jt_popup_item' ).length > 1 ) {
                        // Show Popup
                        $popup_group.on( 'init', function ( event, slick ) {
                            $overlay.fadeIn( 'fast' );
                            $( '#jt_popup_mobile_close_all' ).fadeIn( 'fast' );

                            $popup_group.css( {
                                opacity: 1,
                                visibility: 'visible'
                            } );
                        } );

                        // Slider
                        $popup_group.slick( {
                            slidesToShow: 1,
                            slidesToScroll: 1,
                            infinite: false,
                            autoplay: false,
                            speed: 300,
                            swipeToSlide: true,
                            arrows: false,
                            dots: false,
                            variableWidth: true,
                            centerMode: false,
                            centerPadding: 0
                        } );
                    // Only One Slide
                    } else {
                        $( '#jt_popup_container' ).addClass( 'only_one_slide' );

                        $( '.jt_popup_item' ).each( function () {
                            var $this = $( this );

                            $this.find( 'img' ).on( 'load', function () {
                                $( '#jt_popup_playground' ).css( {
                                    'margin-left': - ( $( '.jt_popup_item' ).width() / 2 ) + 'px',
                                    'left': '50%'
                                } );

                                // Show Popup
                                if ( ! $overlay.is( ':visible' ) ) {
                                    $overlay.fadeIn( 'fast' );
                                }

                                $this.fadeIn( 'fast' );
                            } );
                        } );
                    }

                    // Close All
                    $( '#jt_popup_mobile_close_all' ).on( 'click', function ( e ) {
                        e.preventDefault();

                        // Scroll Active
                        $( 'body' ).removeClass( 'bad_ux_popup_scroll_remove' );

                        $container.fadeOut( 'fast', function () {
                            $( this ).remove();
                        } );
                    } );
                }
            }
            // End Device Mobile Popup

            // Close Popup
            $( '.jt_popup_close' ).on( 'click', function ( e ) {
                e.preventDefault();

                if ( $( '.jt_popup_item' ).length > 0 ) { // Single
                    if ( is_mobile == true ) {
                        // Scroll Active
                        $( 'body' ).removeClass( 'bad_ux_popup_scroll_remove' );
                    }

                    if ( $( '.jt_popup_item' ).length > 1 ) { // two or more
                        if ( is_mobile == false ) { // PC
                            $( this ).parents( '.jt_popup_item' ).fadeOut( 'fast', function () {
                                $( this ).remove();
                            } );
                        } else { // Mobile
                            $popup_group.slick( 'slickRemove', $( this ).parents( '.jt_popup_item' ).index() );
                        }
                    } else { // Multiple
                        $container.fadeOut( 'fast', function () {
                            $( this ).remove();
                        } );
                    }
                }
            } );

            // Popups Cookie Script
            $( '.jt_popup_notoday' ).on( 'click', function ( e ) {
                e.preventDefault();

                // Set Cookie
                var parent_wrap = $( this ).parents( '.jt_popup_item' );

                $.cookie( parent_wrap.attr( 'id' ), 'today_none', { expires: 1, path: '/' } );

                // Popup Close
                if ( $( '.jt_popup_item' ).length > 0 ) { // Single
                    if ( is_mobile == true ) {
                        // Scroll Active
                        $( 'body' ).removeClass( 'bad_ux_popup_scroll_remove' );
                    }

                    if ( $( '.jt_popup_item' ).length > 1 ) { // two or more
                        if ( is_mobile == false ) { // PC
                            $( this ).parents( '.jt_popup_item' ).fadeOut( 'fast', function () {
                                $( this ).remove();
                            } );
                        } else { // Mobile
                            $popup_group.slick( 'slickRemove', $( this ).parents( '.jt_popup_item' ).index() );
                        }
                    } else { // Multiple
                        $container.fadeOut( 'fast', function () {
                            $( this ).remove();
                        } );
                    }
                }
            } );
        }
    }

    window.JT_BAD_UX_POPUP.init();
} ); // End jQuery
