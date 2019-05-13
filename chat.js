
function infoRequest(chat_id) {

    request.post(
        {
            url: server + '/chat/info/' + chat_id + '/' + myInfo.id,
            form: {
                code: myInfo.code
            }
        },
        function (error, response, body) {

            if (response.statusCode != 200) return;

            chatInfo = $.parseJSON(body);
            if (chatInfo == null) window.close();

            writeData('chatUser-' + chatInfo.id, chatInfo.list);

            for (i in chatInfo.list) {
                addBuddy(chatInfo.list[i]);
            }
            sortByName(buddyList);
            writeData('buddyList', buddyList);
            
            prepare();
        }
    );
}

function messageRequest() {

    request.post(
        {
            url: server + '/message/read/' + chatInfo.id + '/' + myInfo.id,
            form: {
                code: myInfo.code
            }
        },
        function (error, response, body) {

            if (response.statusCode != 200) return;

            var messages = $.parseJSON(body);
            
            for (var i in messages) {

                var message = messages[i];

                var pdate = messageList.length > 0 ? messageList[messageList.length - 1].cdate : '';

                addList(messageList, message);

                if (message.type == 110)
                    messageInvite(message.user_id, message.memo, message.cdate, true, pdate);
                
                else if (message.type == 120)
                    messageExit(message.user_id, message.cdate, true, pdate);
                
                else
                    messageIn(message.user_id, message.type, message.text, message.cdate, message.memo, message.id, pdate);
            }
            
            writeData('messageList-' + chatInfo.id, messageList);

            scroll();
        }
    );
}

function sendRequest(text) {

    $('#text').textbox('clear');

    if (text.trim() == '') return;
    
    request.post(
        {
            url: server + '/message/send/',
            form: {
                id: 0,
                chat_id: chatInfo.id,
                user_id: myInfo.id,
                type: 0,
                sent: 0,
                repl: 0,
                text: b64EncodeUnicode(text.trim()),
                memo: myInfo.name,
                cdate: '',
                code: myInfo.code
            }
        },
        sendResponse
    );
}

function sendMedia(filepath) {

    if (isImageFile(filepath) == false) {
        alert("사진 파일이 아닙니다.");
        return;
    }

    message('사진보내기');
    scroll();
    
    request.post(
        {
            url: server + '/upload/media',
            formData: {
                id: myInfo.id,
                code: myInfo.code,
                chat: chatInfo.id,
                type: 1,
                file: fs.createReadStream(filepath)
            }
        },
        sendResponse
    );
}

function sendFile(filepath) {

    message('파일보내기');
    scroll();

    request.post(
        {
            url: server + '/upload/file',
            formData: {
                id: myInfo.id,
                code: myInfo.code,
                chat: chatInfo.id,
                type: 2,
                file: fs.createReadStream(filepath)
            }
        },
        sendResponse
    );
}

function sendResponse(error, response, body) {

    if (response.statusCode != 200) return;
    var message = $.parseJSON(body);
    if (message == null) return;
    
    var pdate = messageList.length > 0 ? messageList[messageList.length - 1].cdate : '';

    if (addList(messageList, message) == false) return;

    writeData('messageList-' + chatInfo.id, messageList);

    messageOut(message.type, message.text, message.cdate, message.id, pdate, message.sent - message.repl);

    scroll();
}

function exitRequest() {

    request.post(
        {
            url: server + '/chat/delete/' + chatInfo.id + '/' + myInfo.id + '/' + chatInfo.type,
            form: {
                code: myInfo.code
            }
        },
        function (error, response, body) {

            if (response.statusCode != 200) return;

            var obj = $.parseJSON(body);
/*
            if (obj.success == false) return;
*/
            ipcRenderer.send('exit', chatInfo.id);
            deleteData('messageList-' + chatInfo.id);
            window.close();
        }
    );
}

function inviteRequest(id) {

    request.post(
        {
            url: server + '/chat/invite/' + chatInfo.id + '/' + id,
            form: {
                id: myInfo.id,
                code: myInfo.code
            }
        },
        function (error, response, body) {

            if (response.statusCode != 200) return;

            var message = $.parseJSON(body);
            if (message == null) return;

            var pdate = messageList.length > 0 ? messageList[messageList.length - 1].cdate : '';
            
            messageInvite(message.user_id, message.memo, message.cdate, message.id, pdate)
            scroll();

            if (addList(messageList, message))
                writeData('messageList-' + chatInfo.id, messageList);
        }
    );
}
