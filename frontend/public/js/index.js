var global_operator = ""
var isFlipCall = false
var current_env = ""
var non_env_call = false

function getVar() {
     $.getJSON("../config.json", function (result) {
        $.getJSON(`${result.backendURL}/api/config`, function (backend) {
            Object.entries(backend).forEach(([key, value]) => {
                console.log(key, value);
                mySelect.append(
                    $('<option></option>').val(key).html(key)
                );
                
            });
            
        });
    });
}
function provider(){
    var mySelect = $('#image');
    
    $.getJSON("../config.json", function (result) {
        if(result.imageURL){
            $("#image").attr("src", result.imageURL).css("height", "30%").css("width", "30%");
        }else{
            $("#image").attr("src", "luffy.png").css("height", "10%").css("width", "10%");
        }
        $.getJSON(`${result.backendURL}/api/config`, function (backend) {
            Object.entries(backend).forEach(([operator, value]) => {
                global_operator = operator;
                mySelect.after(`<h2>${operator} Kong Default Environment Switcher</h2>`)
                var service_list = []
                Object.entries(value.services).forEach(([service, value])=>{
                    service_list.push(service)
                    $('#service_list').append(`<option>${service}</option>`).css("border-radius", "5px");
                })
                if (value.services[service_list[0]].envapi){
                    getCurrentEnv(result, operator, service_list[0]);
                }else{
                    addEnvDropDown()
                }
                $('#service_list').change(() => {
                    var service = $('#service_list :selected').text()
                    //Check env endpoint configured for that service
                    if (value.services[service].envapi) {
                        getCurrentEnv(result, operator, service);
                    }else{
                        addEnvDropDown()
                    }
                })
            });
        });
    });   
}

function addEnvDropDown(){
    non_env_call = true
    $('#env_list').remove()
    $('#myenv').remove()
    var dropDown = '<select class=form-control id=env_list name=env ></select>'
    var options = {
        "Blue": "blue",
        "Green": "green"
    }
    current_env = "Blue"
    $('#service_list').after(dropDown)
    
    $('#env_list').change(() => {
        current_env = $('#env_list :selected').text()
        
    })
    Object.entries(options).forEach(([key, value]) => {
        $('#env_list').append(`<option>${key}</option>`);
    })
}

function getCurrentEnv(result, operator, service){
    non_env_call = false
    $('#env_list').remove()
    $("#flip_btn").attr("disabled", true);
    var settings = {
        "url": `${result.backendURL}/api/env`,
        "method": "POST",
        "timeout": 0,
        "headers": {
            "Content-Type": "application/json"
        },
        "data": JSON.stringify({ "operator": `${operator}`, "service": `${service}` }),
    };
    $.ajax(settings).done(function (response) {
        $('#my_loader').remove()
        $('#myenv').remove()//Current default environment for <service> is <current value>
        $('#label').after(`<label id=myenv>Current default environment for ${service} is <b>${response.env}</b> </label>`).css("padding", "5px")
        if(isFlipCall){
            isFlipCall = false
        }
        current_env = response.env;
        $('#flip_btn').removeAttr("disabled");
    });

}

function flip(){
    var new_env = current_env === "Blue" ? "Green" : "Blue"
    var str = non_env_call ? `This will switch the default environment to ${current_env}. Do you want to continue?` : `This will switch the default environment from ${current_env} to ${new_env}. Do you want to continue?`
    if (confirm(str)){
        $('#flip_btn').after(`<div class="loader" id="my_loader"></div>`)
        $("#flip_btn").attr("disabled", true);
        $.getJSON("../config.json", function (result) {
            var obj = $('form').serializeJSON()
            obj['operator'] = global_operator
            var settings = {
                "url": `${result.backendURL}/api/flip`,
                "method": "POST",
                "timeout": 0,
                "headers": {
                    "Content-Type": "application/json"
                },
                "data": JSON.stringify(obj),
            };
            $.ajax(settings).done(function (response) {
                isFlipCall = true
                if(non_env_call){
                    $('#my_loader').remove()
                }else{
                    getCurrentEnv(result, global_operator, obj.service)
                }
                
            });
        })
    }

    
    
}
