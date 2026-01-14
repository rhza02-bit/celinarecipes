/**
 * ImgBB CDN Manager - Admin Scripts
 * 
 * @package ImgBB_CDN_Manager
 * @version 2.0.0
 */

jQuery(document).ready(function($) {
    
    // ====================================
    // Toggle API Key Visibility
    // ====================================
    $('#toggle-api-key').click(function() {
        var input = $('#api_key');
        if (input.attr('type') === 'password') {
            input.attr('type', 'text');
            $(this).html('🙈 إخفاء');
        } else {
            input.attr('type', 'password');
            $(this).html('👁️ إظهار');
        }
    });
    
    // ====================================
    // Test Connection
    // ====================================
    $('#test-connection').click(function() {
        var btn = $(this);
        var apiKey = $('#api_key').val();
        var result = $('#test-result');
        
        if (!apiKey) {
            result.html('<div class="notice notice-error inline"><p>⚠️ يرجى إدخال API Key</p></div>');
            return;
        }
        
        btn.prop('disabled', true).text('⏳ جاري الاختبار...');
        result.html('<p style="color: #666;">جاري الاتصال بـ ImgBB...</p>');
        
        $.post(imgbbData.ajaxurl, {
            action: 'imgbb_test_connection',
            nonce: imgbbData.nonce,
            api_key: apiKey
        }, function(response) {
            if (response.success) {
                result.html('<div class="notice notice-success inline"><p>' + response.data.message + '</p></div>');
            } else {
                result.html('<div class="notice notice-error inline"><p>' + response.data + '</p></div>');
            }
            btn.prop('disabled', false).text('🧪 اختبار الاتصال');
        }).fail(function() {
            result.html('<div class="notice notice-error inline"><p>❌ فشل الاتصال بالسيرفر</p></div>');
            btn.prop('disabled', false).text('🧪 اختبار الاتصال');
        });
    });
    
    // ====================================
    // Save Settings
    // ====================================
    $('#imgbb-settings-form').submit(function(e) {
        e.preventDefault();
        
        var formData = {
            action: 'imgbb_save_settings',
            nonce: imgbbData.nonce,
            api_key: $('#api_key').val(),
            convert_webp: $('input[name="convert_webp"]').is(':checked') ? '1' : '0',
            max_size: $('#max_size').val(),
            delete_local: $('input[name="delete_local"]').is(':checked') ? '1' : '0',
            auto_cleanup: $('input[name="auto_cleanup"]').is(':checked') ? '1' : '0'
        };
        
        $.post(imgbbData.ajaxurl, formData, function(response) {
            if (response.success) {
                alert('✅ تم حفظ الإعدادات بنجاح!\n\n🔐 API Key تم تشفيره وحفظه بأمان.');
                location.reload();
            } else {
                alert('❌ فشل الحفظ: ' + response.data);
            }
        }).fail(function() {
            alert('❌ فشل الاتصال بالسيرفر');
        });
    });
    
    // ====================================
    // Reset Stats
    // ====================================
    $('#reset-stats').click(function() {
        if (confirm('هل أنت متأكد من إعادة تعيين جميع الإحصائيات؟\n\nسيتم حذف:\n• عدد الصور المرفوعة\n• عدد الفشل\n• إجمالي الحجم\n• آخر رفع')) {
            $.post(imgbbData.ajaxurl, {
                action: 'imgbb_reset_stats',
                nonce: imgbbData.nonce
            }, function(response) {
                if (response.success) {
                    alert('✅ تم إعادة تعيين الإحصائيات بنجاح!');
                    location.reload();
                } else {
                    alert('❌ فشل: ' + response.data);
                }
            });
        }
    });
    
    // ====================================
    // Load Account Info (Dashboard)
    // ====================================
    if ($('#account-info-loading').length) {
        $.post(imgbbData.ajaxurl, {
            action: 'imgbb_get_stats'
        }, function(response) {
            if (response.success) {
                $('#account-info-loading').hide();
                $('#account-info').html(response.data.html).fadeIn();
            } else {
                $('#account-info-loading').html('<p style="color: #d63638;">❌ فشل تحميل البيانات</p>');
            }
        }).fail(function() {
            $('#account-info-loading').html('<p style="color: #d63638;">❌ خطأ في الاتصال</p>');
        });
    }
    
    // ====================================
    // Chart.js Initialization (Dashboard)
    // ====================================
    var ctx = document.getElementById('uploadChart');
    if (ctx && typeof Chart !== 'undefined' && typeof chartLabels !== 'undefined' && typeof chartData !== 'undefined') {
        ctx = ctx.getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'صور مرفوعة',
                    data: chartData,
                    backgroundColor: 'rgba(0, 163, 42, 0.2)',
                    borderColor: 'rgba(0, 163, 42, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#00a32a',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0,
                            color: '#666'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#666'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                }
            }
        });
    }
});
