require('./renderer.js');

function setBuddyCount(count) {
    if (count > 0) {
        $("#buddy_count").text(" (" + count + ")");
    }
    else {
        $("#buddy_count").text("");
    }
}

function setChatCount(count) {
    if (count > 0) {
        $("#chat_count").text(" (" + count + ")");
    }
    else {
        $("#chat_count").text("");
    }
}

function setNoticeCount(count) {
    if (count > 0) {
        $("#notice_count").text(" (" + count + ")");
    }
    else {
        $("#notice_count").text("");
    }
}

function setUnreadMessage(count) {
    if (count > 0) {
        $("#unread_message").addClass("m-badge");
        $("#unread_message").text(count);
    }
    else {
        $("#unread_message").removeClass("m-badge");
        $("#unread_message").text("");
    }
}

function setUnreadNotice(count) {
    if (count > 0) {
        $("#unread_notice").addClass("m-badge");
        $("#unread_notice").text(count);
    }
    else {
        $("#unread_notice").removeClass("m-badge");
        $("#unread_notice").text("");
    }
}

function close2() {

    ipcRenderer.send('close', 0);
}

function myinfo() {

    $.mobile.go('#myinfo'); $('.float').hide();

    setProfile();

    getProfile();
}

$('#mm_create').on('click', function() {
    
    $.mobile.go('#select');

    selectList();
});

$('#mm_member').on('click', member);

function member() {

    $.mobile.go('#member'); $('.float').hide();
/*
    company();
*/
    partRequest(0);
}

$('#mm_search').on('click', search);

function search() {

    $.mobile.go('#search'); $('.float').hide();

    $('.float').hide();
}

$('#mm_delete').on('click', function() {

    deleteNotice();
});

$('#mm_logout').on('click', function() {

    logout();
});

$('#mm_exit').on('click', function() {

    window.close();
});

function office() {
    
    shell.openExternal( 'http://' + myInfo.host + '/dashboard/main.php?token=' + myInfo.password );
}

function option(back) {

    if (back == true) {

        $.mobile.back();
    //  alert('옵션을 적용하려면 트레이메뉴에서 프로그램 종료 후 재실행해야 합니다.');
        alert($.lang[currentLanguage][65]);
    }
    else {
        $.mobile.go('#option'); $('.float').hide();
    }
}

function unregister() {
    
//  if (confirm('계정변경을 위해서 모든 데이터가 삭제된 후 프로그램이 종료됩니다. 계속하시겠습니까?') == false) return;
    if (confirm($.lang[currentLanguage][66]) == false) return;

    deleteAllData();

    window.close();
}

function updateInfo() {
    
    shell.openExternal( "http://talk.officehub.kr/" );
}

function contacts() {
    
    shell.openExternal( "http://talk.officehub.kr:8080/rest/contact/" + myInfo.password );
}

function logout() {

    myInfo.status = 'logout';
    writeData('myInfo', myInfo);
    ipcRenderer.send('logout');
    location.href = 'login.html';
}

function addUnread(chat_id) {
    unreadList.push(chat_id);
}

function countUnread(chat_id) {
    if (chat_id == 0) return unreadList.length;
    var count = 0;
    for (i in unreadList) {
        if (unreadList[i] == chat_id) count++;
    }
    return count;
}

function resetUnread(chat_id) {
    for (i in unreadList) {
        if (unreadList[i] == chat_id) {
            unreadList.splice(i, 1);
            resetUnread(chat_id);
            return;
        }
    }
}

// Logout
ipcRenderer.on('logout', function(e) {

    logout();
});

// exit
ipcRenderer.on('exit', function(e) {

    window.close();
});

// Chat started
ipcRenderer.on('started', function(e, chat_id) {

    resetUnread(chat_id);
    setUnreadMessage(countUnread(0));
    updateChatList();
});

// Message count
ipcRenderer.on('count', function(e, chat_id) {

    if (options[1]) new Audio('wav/bell02.wav').play();

    if (chat_id == 0) return;
    
    addUnread(chat_id);
    setUnreadMessage(countUnread(0));
    chatRequest();
});

// Window closed
ipcRenderer.on('closed', function(e, chat_id) {

    chatRequest();
});

ipcRenderer.on('makeChatRequest', function(e, user_id) {
    request.post(
        {
            url: server + '/chat/create/' + myInfo.id + '/' + user_id,
            form: {
                code: myInfo.code
            }
        },
        chatResponse
    );
});

ipcRenderer.on('groupChatRequest', function(e, participants) {

    console.log(participants);
    
    request.post(
        {
            url: server + '/chat/create/' + myInfo.id,
            form: {
                code: myInfo.code,
                list: participants
            }
        },
        chatResponse
    );
});

function chatResponse(error, response, body) {

    if (response.statusCode == 200) {

        var result = $.parseJSON(body);

        console.log(result)

        var chat_id = result.response;

        startChat(chat_id);
    }
}

function startChat(chat_id) {

    ipcRenderer.send('start', chat_id);
}
