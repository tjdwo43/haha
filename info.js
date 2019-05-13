
function setMyInfo() {
    
    writeData('myInfo', myInfo);

    if (!myInfo.message) myInfo.message = '';

    var status = statusText(myInfo.message.replace(/(<([^>]+)>)/ig,""));
    if (status)
        status = '<div class="list-status status-arrow">' + status + '</div>';

    $('#myinfo_link').html(
        '<img class="list-image" ' + radius + ' src="' + server2 + myInfo.photo + '"/>' + status +
        '<div class="list-name">' + myInfo.name + '</div>' +
        '<div class="list-email">' + myInfo.email + '</div>'
    );

//  var ver = '현재버전';
    var ver = $.lang[currentLanguage][62];
    $('#version').text(' (' + ver + ': ' + getVersion() + ')');
}

function setProfile() {

    if (radius !== '')
        $('#my_photo_frame').attr('style', 'border-radius:10%');

    if (myInfo.photo.indexOf('user.png') >= 0) {
        $('#clear').hide();
        $('#my_photo').attr('src', './img/drag.png');
    }
    else {
        $('#clear').show();
        $('#my_photo').attr('src', server2 + myInfo.photo);
    }
    $('#my_name').text(myInfo.name);
    $('#my_part').text(myInfo.area);
    $('#my_phone').text(myInfo.phone.trim());
    $('#my_email').text(myInfo.email);
    $('#my_status').textbox('setText', myInfo.message);
}

function getProfile() {
    request(
        {
            url: 'http://' + myInfo.host + '/oauth2/userProfile.php?email=' + myInfo.email,
        },
        function (error, response, body) {
            if (response.statusCode == 200) {
                if (body == '') return;
                profile = $.parseJSON(body);
                console.log(profile);
                $('#my_name').text(profile.name);
                $('#my_comp').text(profile.company);
                $('#my_rank').text(profile.rank);
                $('#my_part').text(profile.department);
                $('#my_phone').text(profile.phone.trim());
                $('#my_cell').text(profile.cell_phone);
                $('#my_email').text(profile.cell_email);
                $('#my_job').text(profile.job_position);
            }
        }
    );
}

function uploadProfile(filepath) {
    if (isImageFile(filepath) == false) {
    //  alert("이미지 파일이 아닙니다.");
        alert($.lang[currentLanguage][63]);
        return;
    }
    request.post(
        {
            url: server + '/upload/profile',
            formData: {
                id: myInfo.id,
                code: myInfo.code,
                file: fs.createReadStream(filepath)
            }
        },
        function (error, response, body) {
            if (response.statusCode == 200) {
                myInfo = $.parseJSON(body);
                setMyInfo();
                setProfile();
                console.log(myInfo);
            }
            else
                console.log(response.statusCode);
        }
    );
}

function updateProfile() {
    request.post(
        {
            url: server + '/auth/update',
            form: {
                id: myInfo.id,
                code: myInfo.code,
                info: 'pc',
                photo: myInfo.photo,
                pushid: myInfo.pushid,
                mobile: myInfo.mobile,
                message: myInfo.message
            }
        },
        function (error, response, body) {
            if (response.statusCode == 200) {
                myInfo = $.parseJSON(body);
                setMyInfo();
                setProfile();
                console.log(myInfo);
                console.log(getVersion());

                if (myInfo.info != getVersion()) {

                    updateInfo();
                    window.close();
                }
            }
            else
                console.log(response.statusCode);
        }
    );
}

function syncRequest() {

    var msg_id = popMessageId();

    console.log('syncRequest(' + msg_id + ')');

    if (msg_id == 0) return;

    request.post(
        {
            url: server + '/message/sync/' + msg_id + '/' + myInfo.id,
            form: {
                code: myInfo.code
            }
        },
        function (error, response, body) {
            if (response == undefined) {
                console.log(error);
                return;
            }
            if (response.statusCode == 200) {
                
                var messages = $.parseJSON(body);
                if (messages == null || messages.length == 0) return;

                var chat_id = messages[0].chat_id;
                var messageList = readList('messageList-' + chat_id);
                var len = messageList.length;
                for (i in messages) {

                    if (chat_id != messages[i].chat_id) {
                        writeData('messageList-' + chat_id, messageList);
                        chat_id = messages[i].chat_id;
                        messageList = readList('messageList-' + chat_id);
                    }
                    addList(messageList, messages[i]);
                }
                writeData('messageList-' + chat_id, messageList);

                console.log(len + ' + ' + messages.length + ' = ' + messageList.length);
            }
            else
                console.log(response.statusCode);
        }
    );
}

const {
    START_NOTIFICATION_SERVICE,
    NOTIFICATION_SERVICE_STARTED,
    NOTIFICATION_SERVICE_ERROR,
    NOTIFICATION_RECEIVED,
    TOKEN_UPDATED,
} = require('electron-push-receiver/src/constants');

// Start service
ipcRenderer.send(START_NOTIFICATION_SERVICE, "123913429536");

// Listen for service successfully started
ipcRenderer.on(NOTIFICATION_SERVICE_STARTED, (_, token) => {
    myInfo.pushid = token;
    setTimeout(updateProfile, 1000);
});
// Handle notification errors
ipcRenderer.on(NOTIFICATION_SERVICE_ERROR, (_, error) => {
    console.log(error)
    alert(error.name + "\n" + error.message);
});
// Send FCM token to backend
ipcRenderer.on(TOKEN_UPDATED, (_, token) => {
    console.log(token);
    myInfo.pushid = token;
 });
// Display notification
ipcRenderer.on(NOTIFICATION_RECEIVED, (_, notification) => {
    var message = notification.data;

    console.log(message);

    if (message.type == 100) {
        ipcRenderer.send('reply', message.chat_id);
        return;
    }
    if (message.type == 200) {
        ipcRenderer.send('message', message.memo, message.text, 0, options[2]);
        noticeRequest();
        return;
    }
    if (message.type == 900) {
        ipcRenderer.send('logout');
        location.href = 'logout.html';
        return;
    }

    if (getCommand(message.text, message.type) > 0) return;

    var user = findById(buddyList, message.user_id);
//  var name = '미등록 대화상대';
    var name = $.lang[currentLanguage][64];
    var title = user == null ? name : user.name;
    var content = getMessage(message.text, message.type);

    var exit = content == $.lang[currentLanguage][74];  // '퇴장알림'

    ipcRenderer.send('message', title, content, message.chat_id, options[2], exit);
});

// Message reply
ipcRenderer.on('reply', function(e, chat_id) {
    var messages = readList('messageList-' + chat_id);
    if (messages.length == 0) return;
    increaseReply(messages, indexOfReply(messages, messages.length - 1));
    writeData('messageList-' + chat_id, messages);
});
