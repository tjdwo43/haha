
$('#find2').textbox({
    onChange: function(value, old) {

        if (value != old) findMember(value);
    },
    onClickButton: function() {

        findMember($(this).val());
    }
});

$('#company').combobox({
    onChange: function(value, old) {

        if (value == $('#company').combobox('getText')) return;

        partRequest(0);
    }
});

function partRequest(part) {

    $('#members').children().remove();
/*
    var host = $('#company').val();
*/
    var host = myInfo.host;

    request.post(
        {
            url: server + '/part/' + part,
            form: {
                host: host
            }
        },
        function (error, response, body) {

            if (response.statusCode != 200) return;

            var partList = $.parseJSON(body);
            
            for (var i in partList) {

                $('#members').append(
                    '<li><a onclick="partRequest(' + partList[i].idx + ')"><b>' + partList[i].partName + '</b></a></li>'
                );
            }
        }
    );
    request.post(
        {
            url: server + '/part/member/' + part,
            form: {
                host: host
            }
        },
        memberResponse
    );
}

function findMember(text) {

    if (text == null || text == '') return;

    $('#members').children().remove();
/*
    var host = $('#company').val();
*/
    var host = myInfo.host;

    request.post(
        {
            url: server + '/member/find/',
            form: {
                name: text,
                host: host
            }
        },
        memberResponse
    );
}

function memberResponse(error, response, body) {

    if (response.statusCode != 200) return;

    var memberList = $.parseJSON(body);
/*
    var host = $('#company').val();
*/
    var host = myInfo.host;
    
    for (var i in memberList) {

        if (memberList[i].id == 'null') {
            memberList[i].busu = 'images/user.png';
            memberList[i].name = '<font color="#ccc">' +  memberList[i].name + '</font>';
        }

        var func = 'addMemberRequest(\'' + host + '\', ' + memberList[i].seq + ')';
        var plus = '<button class="member list-button" onclick="' + func + '">대화상대로 등록</button>'

        if (!memberList[i].email) plus = '';

        $('#members').append(
            '<li>' +
            '   <img class="member list-image" ' + radius + ' src="' + server2 + memberList[i].busu + '"/>' + plus +
            '   <div class="member list-name">' + memberList[i].name + '</div>' +
            '   <div class="member list-email">' + memberList[i].email + '</div>' +
            '</li>'
        );
    }
}