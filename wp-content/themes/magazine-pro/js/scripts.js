// Passive event listeners
jQuery.event.special.touchstart = {
    setup: function(_, ns, handle) {
        this.addEventListener("touchstart", handle, { passive: !ns.includes("noPreventDefault") });
    }
};
jQuery.event.special.touchmove = {
    setup: function(_, ns, handle) {
        this.addEventListener("touchmove", handle, { passive: !ns.includes("noPreventDefault") });
    }
};

function externalLinks() {
    for (var c = document.getElementsByTagName("a"), a = 0; a < c.length; a++) {
        var b = c[a];
        b.getAttribute("href") && b.hostname !== location.hostname && (b.target = "_blank")
    }
};

document.addEventListener("DOMContentLoaded", function(event) {
    externalLinks();
});

(function($) {
    $(document).ready(function() {


        if(window.fontsLoaded && window.fontsLoaded === 'no') {
            $(window).one('scroll click mouseover', function(){
                if(window.fontsLoaded === 'no') {
                    window.fontsLoaded = "yes";
                    $('head').append('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lato%3Aital%2Cwght%400%2C400%3B0%2C700%3B1%2C400%3B1%2C700&amp;display=swap&amp;ver=3.6.0" media="all">');
                }
            });
        }

        $('#rank-math-faq .rank-math-list .rank-math-list-item h3').click(function(e) {
            e.preventDefault();

            if (!$(this).parent().hasClass('faqs-item-more')) {
                if ($(this).parent().hasClass('faqs-item-opened')) {
                    $(this).parent().removeClass('faqs-item-opened');
                    $(this).parent().find('.rank-math-answer').slideUp(300);
                } else {
                    $('#rank-math-faq .rank-math-list .rank-math-list-item').removeClass('faqs-item-opened');
                    $('#rank-math-faq .rank-math-list .rank-math-list-item:not(.faqs-item-more) .rank-math-answer').slideUp(300);
                    $(this).parent().toggleClass('faqs-item-opened');
                    $(this).parent().find('.rank-math-answer').slideToggle(300);
                }
            }
        });

        if ($(window).scrollTop() > 100) {
            $('body').addClass('header-scrolled');
        }

        $('a[href*="#"]').click(function(e) {
            var el = $(this).attr('href').replace(/.{0,}(#.+?)$/, '$1');
            if ($(el).offset()) {
                e.preventDefault();
                $('html, body').animate({
                    scrollTop: $(el).offset().top - 100
                }, 700)
            }
        });

        $('#btnToTop').click(function(e) {
            e.preventDefault();
            $('html, body').animate({
                scrollTop: 0
            }, 700)
        })



        $(window).on('scroll', function() {
            if ($(window).scrollTop() > 100) {
                $('body').addClass('header-scrolled');
            } else {
                $('body').removeClass('header-scrolled');
            }
        });

        $('.header-wrapper .primary-nav-menu').click(function() {
            if ($(window).width() < 1024) {
                $('body').toggleClass('mob-nav-opened');
            }
        });

        $('.header-wrapper .primary-nav-menu ul').click(function(e) {
            e.stopPropagation();
        });

        $(window).on('load', function(){
            if ($('img[src*="desk-step-1.png"]').length) {

                var imgs = [
                    '/wp-content/uploads/2019/10/desk-step-1.png',
                    '/wp-content/uploads/2019/10/second1.png',
                    '/wp-content/uploads/2019/10/third1.png',
                    '/wp-content/uploads/2019/10/fourth1.png',
                ];

                var imgsMob = [
                    '/wp-content/uploads/2019/10/mob-step-1-new.png',
                    '/wp-content/uploads/2019/10/mob-step2-new-1.png',
                    '/wp-content/uploads/2019/10/mob-step3-new-1.png',
                    '/wp-content/uploads/2019/10/mob-step4-new-1.png',
                ];

                $('img[src*="desk-step-1.png"]').attr('srcSet', '');

                if ($(window).width() < 768) {
                    $('img[src*="desk-step-1.png"]').attr('src', imgsMob[0])
                }


                jQuery(document).on('gform_page_loaded', function(event, form_id, current_page) {
                        if ($(window).width() < 768) {
                            $('.wp-block-image img').attr('src', imgsMob[parseInt(current_page) - 1])
                        } else {
                            $('.wp-block-image img').attr('src', imgs[parseInt(current_page) - 1])
                        }
                });

            }
        });

    });

})(jQuery)