/**
 * Simple Viewport Loader - JavaScript
 * نظام بسيط ومنظم لتحميل المحتوى
 * احفظ هذا الملف كـ: /js/simple-viewport-loader.js
 */

document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    
    // إعدادات النظام
    const config = {
        sections: [],
        loadedSections: new Set([0]), // القسم الأول محمل افتراضياً
        isLoading: false,
        observer: null,
        progressBar: null,
        totalSections: 0
    };
    
    /**
     * تهيئة النظام
     */
    function init() {
        // العثور على الأقسام
        config.sections = document.querySelectorAll('.svl-section[data-section]');
        config.totalSections = config.sections.length;
        config.progressBar = document.querySelector('.svl-progress-bar');
        
        if (config.totalSections <= 1) {
            return; // لا حاجة للتحميل
        }
        
        // إعداد مراقب التقاطع
        setupIntersectionObserver();
        
        // تحديث شريط التقدم
        updateProgress();
        
        console.log('Simple Viewport Loader initialized with', config.totalSections, 'sections');
    }
    
    /**
     * إعداد مراقب التقاطع (Intersection Observer)
     */
    function setupIntersectionObserver() {
        if (!window.IntersectionObserver) {
            // استخدام طريقة بديلة للمتصفحات القديمة
            setupScrollListener();
            return;
        }
        
        const observerOptions = {
            rootMargin: svlConfig.offset + 'px',
            threshold: 0.1
        };
        
        config.observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    const section = entry.target;
                    const sectionIndex = parseInt(section.dataset.section);
                    
                    // تحميل القسم إذا لم يكن محملاً
                    if (!config.loadedSections.has(sectionIndex)) {
                        loadSection(section, sectionIndex);
                        config.observer.unobserve(section);
                    }
                }
            });
        }, observerOptions);
        
        // مراقبة جميع الأقسام غير المحملة
        config.sections.forEach(function(section) {
            const sectionIndex = parseInt(section.dataset.section);
            if (!config.loadedSections.has(sectionIndex)) {
                config.observer.observe(section);
            }
        });
    }
    
    /**
     * طريقة بديلة للمتصفحات القديمة - استخدام scroll event
     */
    function setupScrollListener() {
        let scrollTimeout;
        
        function checkVisibleSections() {
            config.sections.forEach(function(section) {
                const sectionIndex = parseInt(section.dataset.section);
                
                if (!config.loadedSections.has(sectionIndex) && isElementInViewport(section)) {
                    loadSection(section, sectionIndex);
                }
            });
        }
        
        window.addEventListener('scroll', function() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(checkVisibleSections, 100);
        }, { passive: true });
        
        // فحص أولي
        checkVisibleSections();
    }
    
    /**
     * فحص إذا كان العنصر مرئي في الشاشة
     */
    function isElementInViewport(element) {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        
        return (
            rect.top <= windowHeight + svlConfig.offset &&
            rect.bottom >= -svlConfig.offset &&
            rect.left >= 0 &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    /**
     * تحميل قسم معين
     */
    function loadSection(sectionElement, sectionIndex) {
        if (config.isLoading || config.loadedSections.has(sectionIndex)) {
            return;
        }
        
        config.isLoading = true;
        showProgress();
        
        console.log('Loading section:', sectionIndex);
        
        // إعداد بيانات الطلب
        const formData = new FormData();
        formData.append('action', 'load_section');
        formData.append('post_id', svlConfig.postId);
        formData.append('section_index', sectionIndex);
        formData.append('nonce', svlConfig.nonce);
        
        // إرسال طلب AJAX
        fetch(svlConfig.ajaxurl, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        })
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(function(data) {
            if (data.success) {
                // تحميل المحتوى بنجاح
                displaySection(sectionElement, data.data, sectionIndex);
            } else {
                // خطأ في التحميل
                showError(sectionElement, data.data, sectionIndex);
            }
        })
        .catch(function(error) {
            console.error('Error loading section:', error);
            showError(sectionElement, 'حدث خطأ في تحميل المحتوى', sectionIndex);
        })
        .finally(function() {
            config.isLoading = false;
            hideProgress();
        });
    }
    
    /**
     * عرض القسم المحمل
     */
    function displaySection(sectionElement, content, sectionIndex) {
        // إضافة المحتوى
        sectionElement.innerHTML = content;
        
        // تأثير الظهور
        setTimeout(function() {
            sectionElement.classList.add('svl-loaded');
            config.loadedSections.add(sectionIndex);
            updateProgress();
            
            console.log('Section', sectionIndex, 'loaded successfully');
        }, 100);
    }
    
    /**
     * عرض رسالة خطأ
     */
    function showError(sectionElement, message, sectionIndex) {
        const errorHtml = `
            <div class="svl-error">
                <p>${message}</p>
                <button class="svl-retry-btn" onclick="retryLoadSection(${sectionIndex})">
                    إعادة المحاولة
                </button>
            </div>
        `;
        
        sectionElement.innerHTML = errorHtml;
        sectionElement.classList.add('svl-loaded');
    }
    
    /**
     * إعادة محاولة تحميل قسم
     */
    window.retryLoadSection = function(sectionIndex) {
        const sectionElement = document.querySelector(`[data-section="${sectionIndex}"]`);
        if (sectionElement) {
            // إعادة تعيين حالة القسم
            config.loadedSections.delete(sectionIndex);
            sectionElement.classList.remove('svl-loaded');
            sectionElement.innerHTML = `
                <div class="svl-loading-placeholder">
                    <div class="svl-loading-spinner"></div>
                    <span>جاري التحميل...</span>
                </div>
            `;
            
            // إعادة المحاولة
            loadSection(sectionElement, sectionIndex);
        }
    };
    
    /**
     * إظهار شريط التقدم
     */
    function showProgress() {
        const progressContainer = document.querySelector('.svl-progress');
        if (progressContainer) {
            progressContainer.classList.add('svl-active');
        }
    }
    
    /**
     * إخفاء شريط التقدم
     */
    function hideProgress() {
        const progressContainer = document.querySelector('.svl-progress');
        if (progressContainer) {
            setTimeout(function() {
                progressContainer.classList.remove('svl-active');
            }, 500);
        }
    }
    
    /**
     * تحديث شريط التقدم
     */
    function updateProgress() {
        if (!config.progressBar || config.totalSections <= 1) return;
        
        const loadedCount = config.loadedSections.size;
        const progressPercent = (loadedCount / config.totalSections) * 100;
        
        config.progressBar.style.width = progressPercent + '%';
        
        console.log('Progress:', loadedCount, '/', config.totalSections, '(' + Math.round(progressPercent) + '%)');
        
        // إخفاء الشريط عند اكتمال التحميل
        if (progressPercent >= 100) {
            setTimeout(hideProgress, 1000);
        }
    }
    
    /**
     * تنظيف عند مغادرة الصفحة
     */
    window.addEventListener('beforeunload', function() {
        if (config.observer) {
            config.observer.disconnect();
        }
    });
    
    // بدء التشغيل
    init();
});

/**
 * تحسين الأداء - تحميل الصور عند الظهور
 */
document.addEventListener('DOMContentLoaded', function() {
    if (!window.IntersectionObserver) return;
    
    const imageObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            }
        });
    }, {
        rootMargin: '50px'
    });
    
    // مراقبة جميع الصور مع data-src
    document.querySelectorAll('img[data-src]').forEach(function(img) {
        imageObserver.observe(img);
    });
});