// 等待页面加载完成
document.addEventListener("DOMContentLoaded", function () {

    // 1. 找到所有带 markdown-editor 类的输入框
    const editors = document.querySelectorAll('.markdown-editor');

    editors.forEach(editor => {
        // 2. 监听粘贴事件
        editor.addEventListener('paste', function (e) {
            const items = (e.clipboardData || e.originalEvent.clipboardData).items;

            for (let index in items) {
                const item = items[index];

                // 3. 如果粘贴的是图片
                if (item.kind === 'file' && item.type.indexOf('image/') !== -1) {
                    const blob = item.getAsFile();

                    // 阻止默认粘贴行为（防止粘贴出一堆乱码字符）
                    e.preventDefault();

                    // 4. 执行上传
                    uploadFile(blob, editor);
                }
            }
        });
    });
});

// 上传函数的具体实现
function uploadFile(file, textarea) {
    const formData = new FormData();
    formData.append('file', file);

    // 在光标位置显示 "上传中..."
    insertAtCursor(textarea, "![上传中...]()");

    // 发送请求给后端的 UploadController
    fetch('/api/upload', {
        method: 'POST',
        body: formData
    })
        .then(response => {
            if (!response.ok) throw new Error('上传失败');
            return response.json();
        })
        .then(data => {
            // 上传成功，把 "上传中..." 替换成真正的图片 URL
            const markdownImage = `![](${data.url})`;
            const newText = textarea.value.replace("![上传中...]()", markdownImage);
            textarea.value = newText;
        })
        .catch(error => {
            console.error('Error:', error);
            alert('图片上传失败，请重试');
            // 失败了就把占位符删掉
            textarea.value = textarea.value.replace("![上传中...]()", "");
        });
}

// 辅助函数：在光标位置插入文字
function insertAtCursor(myField, myValue) {
    if (document.selection) {
        myField.focus();
        sel = document.selection.createRange();
        sel.text = myValue;
    } else if (myField.selectionStart || myField.selectionStart == '0') {
        var startPos = myField.selectionStart;
        var endPos = myField.selectionEnd;
        myField.value = myField.value.substring(0, startPos)
            + myValue
            + myField.value.substring(endPos, myField.value.length);
    } else {
        myField.value += myValue;
    }
}