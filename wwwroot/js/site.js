// === 批量上传状态管理 ===
const uploadBatch = {
    total: 0,
    processed: 0,
    success: 0,
    fail: 0
};

function initBatch(count) {
    uploadBatch.total = count;
    uploadBatch.processed = 0;
    uploadBatch.success = 0;
    uploadBatch.fail = 0;
    showToast(`开始处理 ${count} 张图片...`, 'loading');
}

function updateBatch(isSuccess) {
    uploadBatch.processed++;
    if (isSuccess) uploadBatch.success++;
    else uploadBatch.fail++;

    // 检查是否全部完成
    if (uploadBatch.processed === uploadBatch.total) {
        const msg = `上传完成：成功 ${uploadBatch.success} 张，失败 ${uploadBatch.fail} 张`;
        const type = uploadBatch.fail === 0 ? 'success' : 'error'; // 如果有失败的，用红色提示
        showToast(msg, type);
    }
}

// 等待页面加载完成
document.addEventListener("DOMContentLoaded", function () {
    const editors = document.querySelectorAll('.markdown-editor');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('imageUploadInput');

    editors.forEach(editor => {
        // === 1. 粘贴上传 ===
        editor.addEventListener('paste', function (e) {
            const items = (e.clipboardData || e.originalEvent.clipboardData).items;
            const imageItems = [];
            for (let index in items) {
                const item = items[index];
                if (item.kind === 'file' && item.type.indexOf('image/') !== -1) {
                    imageItems.push(item);
                }
            }
            
            if (imageItems.length > 0) {
                // 限制单次上传数量
                if (imageItems.length > 50) {
                    showToast('单次最多允许上传 50 张图片', 'error');
                    return;
                }
                
                e.preventDefault();
                initBatch(imageItems.length); // 初始化批次
                imageItems.forEach(item => {
                    handleImageUpload(item.getAsFile(), editor);
                });
            }
        });

        // === 2. 拖拽上传 ===
        editor.addEventListener('dragover', function (e) {
            e.preventDefault();
            e.stopPropagation();
            editor.style.border = "2px dashed #0d6efd";
        });

        editor.addEventListener('dragleave', function(e) {
             e.preventDefault();
             e.stopPropagation();
             editor.style.border = "none";
        });

        editor.addEventListener('drop', function (e) {
            e.preventDefault();
            e.stopPropagation();
            editor.style.border = "none";

            const files = e.dataTransfer.files;
            const imageFiles = [];
            if (files && files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    if (files[i].type.indexOf('image/') !== -1) {
                        imageFiles.push(files[i]);
                    }
                }
                
                if (imageFiles.length > 0) {
                    // 限制单次上传数量
                    if (imageFiles.length > 50) {
                        showToast('单次最多允许上传 50 张图片', 'error');
                        return;
                    }

                    initBatch(imageFiles.length); // 初始化批次
                    imageFiles.forEach(file => {
                        handleImageUpload(file, editor);
                    });
                }
            }
        });
    });

    // === 3. 按钮点击上传 ===
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', function () {
            if (this.files && this.files.length > 0) {
                // input 多选也需要限制（虽然通常不会选那么多）
                if (this.files.length > 50) {
                    showToast('单次最多允许上传 50 张图片', 'error');
                    this.value = '';
                    return;
                }

                initBatch(this.files.length); 
                Array.from(this.files).forEach(file => {
                    handleImageUpload(file, document.querySelector('.markdown-editor'));
                });
                this.value = ''; 
            }
        });
    }
});

// 显示 Toast 消息
function showToast(message, type = 'info') {
    const toastEl = document.getElementById('liveToast');
    const toastBody = toastEl.querySelector('.toast-body');
    
    // 设置消息内容
    let icon = '';
    if (type === 'loading') {
        icon = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>';
    } else if (type === 'success') {
        icon = '<i class="bi bi-check-circle-fill text-success me-2"></i>';
    } else if (type === 'error') {
        icon = '<i class="bi bi-x-circle-fill text-danger me-2"></i>';
    }
    
    toastBody.innerHTML = `${icon}${message}`;
    
    const toast = new bootstrap.Toast(toastEl); // 默认 5000ms
    toast.show();
}

// 通用：压缩并上传处理函数
function handleImageUpload(blob, editor) {
    // 使用 compressorjs 压缩图片
    new Compressor(blob, {
        quality: 0.8,
        mimeType: 'image/webp',
        success(result) {
            uploadFile(result, editor);
        },
        error(err) {
            console.error('压缩失败:', err);
            // 压缩失败也尝试传原图，不算业务失败，除非原图也传不上去
            uploadFile(blob, editor); 
        },
    });
}

// 核心上传请求函数
function uploadFile(file, textarea) {
    const formData = new FormData();
    const fileName = file.name || "image.webp"; 
    formData.append('file', file, fileName);

    const uniqueId = "uploading-" + Math.random().toString(36).substr(2, 9);
    const placeholder = `![图片上传中... (${uniqueId})]()`;

    insertAtCursor(textarea, placeholder);

    fetch('/api/upload', {
        method: 'POST',
        body: formData
    })
        .then(response => {
            if (!response.ok) throw new Error('上传失败');
            return response.json();
        })
        .then(data => {
            const markdownImage = `![](${data.url})`;
            textarea.value = textarea.value.replace(placeholder, markdownImage);
            updateBatch(true); // 标记成功
        })
        .catch(error => {
            console.error('Error:', error);
            textarea.value = textarea.value.replace(placeholder, `![上传失败 - 请重试]()`);
            updateBatch(false); // 标记失败
        });
}

// 辅助函数：在光标位置插入文字
function insertAtCursor(myField, myValue) {
    if (myField.selectionStart || myField.selectionStart == '0') {
        var startPos = myField.selectionStart;
        var endPos = myField.selectionEnd;
        myField.value = myField.value.substring(0, startPos)
            + myValue
            + myField.value.substring(endPos, myField.value.length);
        
        myField.selectionStart = startPos + myValue.length;
        myField.selectionEnd = startPos + myValue.length;
        myField.focus(); // 保持焦点
    } else {
        myField.value += myValue;
    }
}