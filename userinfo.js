
function userInfo(id) {

    $.mobile.go('#userinfo');

    var user = findById(buddyList, id);
    if (user == null) user = findById(userList, id);
    if (user == null) return;

    if (radius !== '')
        $('#user_photo_frame').attr('style', 'border-radius:10%');
    
    $('#user_photo').attr('src', server2 + user.photo);
    $('#user_name').text(user.name);
    $('#user_part').text(user.area && user.area != 'null' ? user.area : '');
    $('#user_phone').text(user.phone.trim());
    $('#user_email').text(user.email);
    if (user.message && user.message != 'null')
        $('#user_status').textbox('setText', user.message.replace(/(<([^>]+)>)/ig,""));
    else
        $('#user_status').textbox('setText', '');

    if (id == myInfo.id)
        $('#user_chat').hide();
    else {
        $('#user_chat').show();
        $('#user_chat').attr('href', 'javascript:makeChat(' + id + ')');
    }

    getUserProfile(user.host, user.email);
}

function makeChat(id) {

    $.mobile.back();

    makeChatRequest(id);
}
