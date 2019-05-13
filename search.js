
$('#find').textbox({
    onChange: function(value, old) {

        if (value != old) findUser(value);
    },
    onClickButton: function() {

        findUser($(this).val());
    }
});

function findUser(text) {

    if (text == null || text == '') return;

    $('#users').children().remove();

    request.post(
        {
            url: server + '/user/find/',
            form: { name : text }
        },
        function (error, response, body) {

            if (response.statusCode != 200) return;
            
            userList = $.parseJSON(body);
            if (userList == null) userList = [];
            
            for (var i in userList) {

                console.log(userList[i].name);

                $('#users').append(
                    '<li><a href="javascript:userInfo(' + userList[i].id + ');">' +
                    '   <img class="member list-image" ' + radius + ' src="' + server2 + userList[i].photo + '"/>' +
                    '   <div class="member list-name">' + userList[i].name + '</div>' +
                    '   <div class="member list-email">' + userList[i].email + '</div></a>' +
                    '</li>'
                );
            }
        }
    );
}