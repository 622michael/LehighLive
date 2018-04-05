//features to implement
//delete schedule
//on select section on calendar select class on scheduled list
//refactor everything
//Current schedule?
//Current semester
//textbooks partnership


var dayLetters=["M","T","W","R","F"];
var fullDays=["Monday","Tuesday","Wednesday","Thursday","Friday"];
var semesters=["Fall 2018", "Spring 2018","Fall 2017","Spring 2017"];
var MyData = {};
MyData.all_courses=[];

var colors=['#d32f2f','#f44336','#FF5722','#FF9800','#FFC107','#8BC34A','#4CAF50','#009688','#00BCD4','#03A9F4','#1976D2','#01579B','#3F51B5','#673AB7','#9C27B0',
    '#e91e63','#795548','#34495e','#0D3C55','#616161'];
MyData.unUsedColors=colors;
MyData.classes=[];
MyData.events_share=[];
MyData.course_desc={};
MyData.course_prereq={};
MyData.prof_rating={};
MyData.curClass='';
MyData.colorClass='';
MyData.isLocalDataStorage=true;
MyData.screen='courses';
MyData.isLoggedIn=false;
$( document ).ready(function() {

    var developmentMode=true;
    var version = "1.09";
    var curClass='';
    $('.version').each(function(i, obj) {
        $(this).text("Version: "+version);
    });
    setDesc();
    MyData.isLocalDataStorage=isLocalStorageNameSupported();
    if(window.location.pathname.includes("courses")){
        MyData.screen='courses';
        loadData(developmentMode,version);
    }
    else if(window.location.pathname.includes("share")){
        MyData.screen='share';

    }

    var takes=[];
    var majors=[];

    $("#load-message").text("Getting Courses...");

    var majorData=rest('GET','/courses/getMajors',{});

    selected=true;
    for(var i=0;i<majorData.length;i++){
        majors[i]=majorData[i].dept_id+' - '+majorData[i].dept_name;
    }

    $("#loading").remove();
    $("#cover").animate({"background-color": "transparent"}, 150);
    $("#top").css("display","block");
    $("#top").animate({"opacity": "1"}, 400);
    if(MyData.screen=='courses'){
        $('#calendar').fullCalendar({
            header:false,
            defaultView: 'agendaWeek',
            columnFormat: {
                week: 'dddd',
            },
            minTime:"7:00:00",
            maxTime:"22:00:00",
            slotDuration: '00:30:00',
            aspectRatio: 2,
            height:"auto",
            scrollTime:'10:00:00',
            weekends:false,
            slotEventOverlap:false,
            allDaySlot:false,
            eventLimit: true,
            timeFormat: '',
            dayRender: function(daysOfWeek, cell)
            {
                $(cell).removeClass('fc-state-highlight');
            },
            events: [
            ],
            eventRender:function(event,element){
                $(element).tooltip({title: "Seats: "+event.seats,animation:true,delay:25});
                if($('#calendar').fullCalendar('clientEvents').length!=0||isAnythingScheduled()){
                    $('#no-classes').stop().animate({opacity:0},200,function(){$("#no-classes").hide()});
                    $('#calendar').stop().animate({opacity:1},300);
                }
            },
            eventClick: function(e){
                if($(window).width()<=800){
                    $('html,body').animate({
                        scrollTop: $("#add-class").offset().top-60
                    });
                }
                var course_id=e.title.split("-")[0];
                setCurClass(course_id);
                displaySections(removeSpaceFromClass(course_id));
            },
            eventDestroy: function(e){
                if($('#calendar').fullCalendar('clientEvents').length==0&&!isAnythingScheduled()){
                    $('#no-classes').stop().animate({opacity:1},200,function(){$("#no-classes").show()});
                    $('#calendar').stop().animate({opacity:.6},300);
                }
            }
        });
        createAllCalendarEvents();
        if($('#calendar').fullCalendar('clientEvents').length==0&&!isAnythingScheduled()){
            $('#no-classes').show();
            $('#calendar').css("opacity",.6);
        }
    }
    else if(MyData.screen=='share'){
        $('#calendar-share').fullCalendar({
            header:false,
            defaultView: 'agendaWeek',
            columnFormat: {
                week: 'dddd',
            },
            minTime:"7:00:00",
            maxTime:"22:00:00",
            slotDuration: '00:30:00',
            aspectRatio: 2,
            height:"auto",
            scrollTime:'10:00:00',
            weekends:false,
            slotEventOverlap:false,
            allDaySlot:false,
            eventLimit: true,
            timeFormat: '',
            dayRender: function(daysOfWeek, cell)
            {

                $(cell).removeClass('fc-state-highlight');
            },
            events: [
            ],
            eventRender:function(event,element){
                $(element).tooltip({title: "CRN - "+event.id,animation:true});
            },
            eventClick: function(e){

            }
        });
        var search=window.location.search;
        search = search.substring(1,search.length);
        var student=getUrlParameter('sharedFrom');
        $("#student-name").text(student+" Schedule");
        MyData.events_share=rest("GET","share/crns",search);
        var credits=0;
        for(var index=0;index<MyData.events_share.length;index++){
            var color=getRandomColor(MyData.unUsedColors);
            if(MyData.unUsedColors.length===0){
                color=getRandomColor(colors);
            }
            MyData.unUsedColors=removeItem(MyData.unUsedColors,color);
            MyData.events_share[index].color=color;
            MyData.events_share[index].name=MyData.events_share[index].course_id;
            createShareEvent(MyData.events_share[index]);
            credits+=Number(MyData.events_share[index].credits);
        }

        editCredits(credits);
    }

    if(MyData.screen=="share"){
        $(".navbar-right").remove();
        $("#share-button").remove();
    }

    /*for(var i=0;i<semesters.length;i++){
	$('#semester').append("<div class='semester-list'>"+semesters[i]+"</div>");
    }*/
    readyDays();

    new Clipboard('#copy');
    var crn_clip=new Clipboard('#share-crns');
    crn_clip.on('success', function(e) {
        $('#share-copied').css('opacity',1);
        $('#share-copied').stop().animate({opacity:0},1000);
    });

    $('#majors').val('');
    $('#courses').val('');
    $('#crn-box').val('');
    var color_boxes=$('.color_box');
    color_boxes.each(function(i){
        $(this).css("background-color",colors[i]);
    });
    $( "#majors" ).autocomplete({
        source: function(request, response) {
            var results = $.ui.autocomplete.filter(majors, request.term);
            response(results);
        },minLength: 0,
        select: function(event, ui) {
            if(ui.item&&selected){
                var dept_id=ui.item.value.split(" - ")[0];
                var courses=[];
                changeHeaderText("Select Course");
                $("#add-major").css("border-bottom","none");
                $("#add-major").css("padding-bottom","0px");
                $("#add-course").css("display","block");
                var courseData=rest('GET','/courses/getCourses/'+dept_id,{});

                for(var i=0;i<courseData.length;i++){
                    courses[i]=courseData[i].course_id+' - '+courseData[i].title;
                }
                $( "#courses" ).autocomplete({
                    source: function(request, response) {
                        var results = $.ui.autocomplete.filter(courses, request.term);
                        response(results);
                    },
                    select: function(event, ui) {
                        if(ui.item&&selected){
                            $("#scheduler-divider").css("display","block");
                            $("#sections").empty();
                            $("#course-name").show();
                            $("#add-course").css("border-bottom","none");
                            $("#add-course").css("padding-bottom","0px");
                            var course_id=ui.item.value.split(" - ")[0];
                            curClass=course_id;
                            changeHeaderText("Select Section");
                            if($.inArray(course_id, MyData.classes)!=-1){
                                setCurClass(course_id);
                                displaySections(removeSpaceFromClass(course_id));
                            }
                            else{
                                MyData.classes.push(course_id);

                                var sectionData=rest('GET','/courses/getSections/'+course_id,{});
                                $("#course-list").append("<div id='"+course_id.split(' ')[0]+course_id.split(' ')[1]+"' class='course'>"+course_id+"<img id='palette' style='width:24px;position:absolute;right:35px;' src='assets/blank.png' ><img id='trash' style='width:24px;position:absolute;right:5px;' src='/assets/delete_unscheduled.png'></div>");

                                var crns=[];
                                var color=getRandomColor(MyData.unUsedColors);
                                if(MyData.unUsedColors.length===0){
                                    color=getRandomColor(colors);
                                }

                                MyData.unUsedColors=removeItem(MyData.unUsedColors,color);

                                for(var i=0;i<sectionData.length;i++){
                                    MyData.all_courses.push({
                                        name:course_id,
                                        title:sectionData[i].title,
                                        crn:sectionData[i].crn,
                                        sec_id:sectionData[i].sec_id,
                                        inst_name:sectionData[i].name,
                                        tid:sectionData[i].tid,
                                        rating:sectionData[i].rating,
                                        semester:sectionData[i].semester,
                                        course_desc:sectionData[i].course_desc,
                                        year:sectionData[i].year,
                                        time:sectionData[i].time_slot,
                                        color:color,
                                        credits:sectionData[i].credits,
                                        seats:sectionData[i].seats,
                                        room:sectionData[i].room,
                                        is_scheduled:0});
                                    crns.push(sectionData[i].crn);
                                }
                                setCurClass(curClass);
                                displaySections(removeSpace(course_id));
                                rest('POST','/student/newCourse',JSON.stringify({
                                    crns:crns,
                                    semester:sectionData[0].semester,
                                    year:sectionData[0].year,
                                    color:color,
                                    is_scheduled:0}));
                                setCollapseProf();
                                saveData();
                            }
                        }
                        else{
                            $(this).val(''); return false;
                        }
                    },
                    messages: {
                        noResults: '',
                        results: function() {}
                    },minLength:0,
                }).focus(function(){
                    $(this).autocomplete("search",$(this).val());
                });
            }
            else{
                $(this).val(''); return false;
            }

        },
        messages: {
            noResults: '',
            results: function() {}
        }
    }).focus(function(){
        $(this).autocomplete("search",$(this).val());
    });


    $('.ui-widget input').on('click focusin', function() {
        this.value = '';
    });

    $('#majors').on('keypress',function(e){
        if ( e.which == 13 ) return false;
    });
    $('#courses').on('keypress',function(e){
        if ( e.which == 13) return false;
    });
    var top=0;
    var interval;
    var speed=4;
    $(".up").bind('mousedown touchstart',function () {

        interval=setInterval(calendarUp, 0);

    });

    $(".up").bind('mouseup mouseleave touchend',function(){

        clearInterval(interval);
    });

    $(".down").bind('mousedown touchstart',function () {

        interval=setInterval(calendarDown,0);

    });

    $(".down").bind('mouseup mouseleave touchend',function(){

        clearInterval(interval);
    });

    $("#sections").on('mouseenter', ".panel", function() {
        var curSection=MyData.all_courses[getCourse($(this).attr("id"))];

        if(curSection.is_scheduled==0){

            createCalendarEvents($(this).attr("id"));
        }
    });
    $("#sections").on('mouseleave', ".panel", function() {
        var curSection=MyData.all_courses[getCourse($(this).attr("id"))];

        if(curSection.is_scheduled==0){
            $('#calendar').fullCalendar('removeEvents',$(this).attr('id'));
        }
    });



    $("#sections").on('touch click', ".panel", function(e) {
        e.stopPropagation();
        e.preventDefault();
        if($(this).hasClass('accordion')||$(this).hasClass('folder')||$(this).hasClass('folder-padding')||$(this).hasClass('folder-padding'))
            return;
        var curSection=MyData.all_courses[getCourse($(this).attr("id"))];
        var fullname=curSection.name;
        var name=removeSpace(fullname);

        if (curSection.is_scheduled==0){
            var this_course=getCourse($(this).attr('id'));
            var current=MyData.all_courses[this_course];
            $(this).append("<div class='room-text'><b>Room&nbsp;-</b>&nbsp;"+current.room+"</div>");
            if($(this).children().hasClass("title-text")){
                $(this).stop().animate({height:85},{duration:400});
            }
            else{
                $(this).stop().animate({height:65},{duration:400});
            }

            $('#calendar').fullCalendar('removeEvents',$(this).attr('id'));
            var element=$('#'+name).detach();
            current.is_scheduled=1;
            colorSection($(this),curSection);
            scheduleSection(element);
            $('#no-classes').stop().animate({opacity:0},200,function(){$("#no-classes").hide()});
            $('#calendar').stop().animate({opacity:1},300);
            element.css('background-color',current.color);
            editCredits(Number(current.credits));
            $('#scheduled').append(element);
            createCalendarEvents($(this).attr('id'));
        }
        else{
            var current=MyData.all_courses[getCourse($(this).attr('id'))];
            current.is_scheduled=0;
            if($(this).children().hasClass("title-text")){
                $(this).stop().animate({height:65},{duration:300});
            }
            else{
                $(this).stop().animate({height:45},{duration:300});
            }
            editCredits(Number(current.credits)*-1);
            $(this).css('border-left','solid 4px #EEEEEE');
            if(!isAnythingScheduled()){
                $('#no-classes').stop().animate({opacity:1},200,function(){$("#no-classes").show()});
                $('#calendar').stop().animate({opacity:.6},300);
                $("#scheduled").css("border-bottom","none");
            }
            if(!checkIsScheduled(fullname)){
                var element=$('#'+name).detach();
                element.css('color','#616161');
                element.find('img#trash').attr('src','/assets/delete_unscheduled.png');
                element.find('img#palette').attr('src','/assets/blank.png');
                element.css('background-color','#f5f5f5');
                $('#course-list').append(element);
            }
            $('#calendar').fullCalendar('removeEvents',$(this).attr('id'));
            $(this).children().last().remove();

        }
        var this_data=MyData.all_courses[getCourse($(this).attr('id'))];
        rest('PUT','/student/newCourse',JSON.stringify({
            crn:this_data.crn,
            semester:this_data.semester,
            year:this_data.year,
            is_scheduled:this_data.is_scheduled
        }));
        saveData();

    });


    $("#scheduling div").on('touch click',"*",function(e){
        e.stopPropagation();

        if($(this).context.localName!='img'){
            var course_id=$(this).attr('id');

            if(addSpaceToClass(course_id)!=MyData.curClass){
                e.stopPropagation();
                displaySections(course_id);
                setCurClass(addSpaceToClass(course_id));
            }
        }
        else{
            if($(this).attr("id")=="trash"){
                e.stopPropagation();
                var tempClass=removeSpaceFromClass(MyData.curClass);

                var cClass = addSpaceToClass($($(this).context.parentElement).attr('id'));
                for(var i=0;i<MyData.all_courses.length;i++){
                    if(MyData.all_courses[i].name==cClass){
                        $('#calendar').fullCalendar('removeEvents',MyData.all_courses[i].crn);
                    }
                }
                var cur_crns=loadSections(cClass);
                var crns=[];

                removeCreditsFromClass(cClass);
                setCurClass(curClass);
                MyData.classes.splice( MyData.classes.indexOf(cClass), 1);
                MyData.all_courses=removeSections(cClass);


                if(!nextUnscheduled())
                    $("#sections").empty();
                else{
                    var cur=nextUnscheduled().name;
                    displaySections(removeSpaceFromClass(cur));
                    setCurClass(cur);
                    curClass=cur;
                }
                for(var j in cur_crns){
                    crns.push(cur_crns[j].crn);
                }
                rest("POST",'/student/deleteCourse', JSON.stringify({
                    crns:crns,
                    semester:cur_crns[0].semester,
                    year:cur_crns[0].year}));
                $($(this).context.parentElement).detach();
                if(!isAnythingScheduled()){
                    curClass='';
                    $("#courses").val('');
                    if(MyData.all_courses.length==0){
                        $("#scheduler-divider").css("display","none");
                        $("#course-desc").text("Select a Course");
                        $("#course-name-left").text("");
                    }
                    $('#no-classes').stop().animate({opacity:1},200,function(){$("#no-classes").show()});
                    $('#calendar').stop().animate({opacity:.6},300);
                    changeHeaderText("Select Course");
                    $("#scheduled").css("border-bottom","none");

                }
            }
            else if($(this).attr("id")=="palette"&&rgb2hex($($(this).context.parentElement).css('background-color'))!='#f5f5f5'){
                e.stopPropagation();
                chooseColor();
                MyData.colorClass=addSpaceToClass($($(this).context.parentElement).attr('id'));


            }
        }
        saveData();
    });






    $(window).resize(function() {
        if((($(window).width()>500&&$(window).width()<800)||$(window).width()>=1200)){
            if(MyData.all_courses.length>0){
                $("#course-name-right").text("Course Description")
                changeHeaderText("Select Section from "+MyData.curClass);
            }
        }
        else{
            if(MyData.all_courses.length>0){
                $("#course-name-right").text("Description");
                changeHeaderText("Select Section");
            }
        }
        if($(window).width()<800){
            var i=0;
            $("th.fc-day-header").each(function() {
                $(this).text(fullDays[i].substring(0,3));
                i++;
            });
            $("#copy-img").css("display","block");
            $("#copy-text").css("display","none");
            $("#close-img").css("display","block");
            $("#close-text").css("display","none");
        }
        else{
            var i=0;
            $("th.fc-day-header").each(function() {
                $(this).text(fullDays[i]);
                i++;
            });
            $("#copy-text").css("display","block");
            $("#copy-img").css("display","none");
            $("#close-img").css("display","none");
            $("#close-text").css("display","block");
        }
        if($(window).width()<1000){
            var h=460;
            top=0;
            if(MyData.screen=="courses"){
                $("#calendar").css("margin-top",0);
                $("#calendar-container").height(h);
            }
            else{
                $("#calendar-share").css("margin-top",0);
                $(".share-calendar").height(h);
            }
        }
        else{
            var h=$(window).height()-110<695?$(window).height()-110:695;

            top=0;
            if(MyData.screen=="courses"){
                $("#calendar").css("margin-top",0);
                $("#calendar-container").height(h);
            }
            else{
                $("#calendar-share").css("margin-top",0);
                $(".share-calendar").height(h);
            }
        }
    });


    function readyDays(){

        if($(window).width()<800){
            var i=0;
            $("th.fc-day-header").each(function() {
                $(this).text(fullDays[i].substring(0,3));
                i++;
            });
            $("#copy-img").css("display","block");
            $("#copy-text").css("display","none");
            $("#close-img").css("display","block");
            $("#close-text").css("display","none");
        }
        else{
            var i=0;
            $("th.fc-day-header").each(function() {
                $(this).text(fullDays[i]);
                i++;
            });
            $("#copy-img").css("display","none");
            $("#copy-text").css("display","block");
            $("#close-img").css("display","none");
            $("#close-text").css("display","block");
        }


    }
    if($(window).width()<1000){
        var h=460;
        top=0;
        if(MyData.screen=="courses"){
            $("#calendar").css("margin-top",0);
            $("#calendar-container").height(h);
        }
        else{
            $("#calendar-share").css("margin-top",0);
            $(".share-calendar").height(h);
        }
    }
    else{
        var h=$(window).height()-110<695?$(window).height()-110:695;

        top=0;
        if(MyData.screen=="courses"){
            $("#calendar").css("margin-top",0);
            $("#calendar-container").height(h);
        }
        else{
            $("#calendar-share").css("margin-top",0);
            $(".share-calendar").height(h);
        }
    }

    function calendarUp(){
        if(top-speed>=0){
            top-=speed;
            var upSpeed='+='+speed+'px';
            if(MyData.screen=="courses")
                $("#calendar").animate({ marginTop: upSpeed }, 0);
            else
                $("#calendar-share").animate({ marginTop: upSpeed }, 0);
        }
    }
    function calendarDown(){
        if(MyData.screen=="courses"){
            if(top+speed<=684-$('#calendar-container').height()){
                top+=speed;
                var downSpeed='-='+speed+'px';
                $("#calendar").animate({ marginTop: downSpeed }, 0);
            }
        }
        else{
            if(top+speed<=684-$('.share-calendar').height()){
                top+=speed;
                var downSpeed='-='+speed+'px';
                $("#calendar-share").animate({ marginTop: downSpeed }, 0);
            }
        }
    }

    $('.color_box').click(function(){
        setCourseColor(rgb2hex($(this).css("backgroundColor")));
    });

    $(document).on('touchend mouseup',function (e)
    {
        if(e.target.id=='dim'||e.target.id=='top-container')
            hideExport();
    });

    $('.nav a').click(function(){
        $('#navbar-collapse-1').collapse('hide');
    });



});



function loadData(devMode,version){
    //load things from localStorage
    // if(!localStorage.getItem("id")){
    // 	localStorage.setItem("id",idGenerator());
    // }
    // else{
    // 	console.log(localStorage.getItem("id"));
    // }
    var loggedin=false;
    var sections=rest('GET','/student/takes',{});
    if(sections!=null){
        console.log(sections);
        loggedin=true;
        MyData.isLoggedIn=true;
        MyData.all_courses=sections;
        if(MyData.isLocalDataStorage&&sections.length==0){
            var temp_courses=JSON.parse(localStorage.getItem("all_courses"));
            if(temp_courses!=null){
                for(var i=0;i<temp_courses.length;i++){
                    var c=temp_courses[i];
                    var data=JSON.stringify({
                        crns:[c.crn],
                        semester:c.semester,
                        year:c.year,
                        color:c.color,
                        is_scheduled:c.is_scheduled});
                    rest("POST",'/student/newCourse', data);
                    MyData.all_courses=JSON.parse(localStorage.getItem("all_courses"));
                }
            }
        }
    }
    if(loggedin&&MyData.isLocalDataStorage){
        if(!localStorage.getItem("version")){
            //message
        }
        else{
            if(version!=localStorage.getItem("version")){
                //message
            }
        }
        localStorage.setItem("version",version);
    }
    if(!loggedin&&MyData.isLocalDataStorage){
        if(devMode){
            if(!localStorage.getItem("version")){
                //help();
                //$(".header").text("Getting Started");
                contact();
                $(".header").text(semesters[0]+" Classes!");
                $("#contact").empty();
                $("#contact").append("<p>All courses have been updated!</p>");
                $("#contact").append("<p>Start planning your schedule for the new semester!</p>");
                $("#contact").append("<p>We're starting a Patreon! If you enjoy the website, please consider donating! </p>");
                $("#contact").append("<a href='https://www.patreon.com/ezsemester' target='_blank'><img src='/assets/patreon.png' class='patreon-main' ></a>");

                localStorage.setItem("version",version);
            }
            else{

                if(version!=localStorage.getItem("version")){
                    contact();
                    $(".header").text(semesters[0]+" Classes!");
                    $("#contact").empty();
                    $("#contact").append("<p>All courses have been updated!</p>");
                    $("#contact").append("<p>Start planning your schedule for the new semester!</p>");
                    $("#contact").append("<p>We're starting a Patreon! If you enjoy the website, please consider donating! </p>");
                    $("#contact").append("<a href='https://www.patreon.com/ezsemester' target='_blank'><img src='/assets/patreon.png' class='patreon-main' ></a>");

                    /*
                    var temp_courses=JSON.parse(localStorage.getItem("all_courses"));
                    if(temp_courses!=null){

                    var temp_classes=JSON.parse(localStorage.getItem("classes"));
                    var scheduled_classes={};

                    for(var i=0;i<temp_courses.length;i++){
                        var c=temp_courses[i];
                        scheduled_classes[c.crn]={is_scheduled:c.is_scheduled,color:c.color};
                    }
                    var final_data=[];
                    $("#load-message").text("Updating Courses...");
                    for(var i=0;i<temp_classes.length;i++){
                        var section_data=rest("GET",'/courses/getSections/'+temp_classes[i], {});
                        for(var j=0;j<section_data.length;j++){
                        var c=section_data[j];
                        if(!(c.crn in scheduled_classes)){
                            continue;
                        }
                        c.is_scheduled=scheduled_classes[c.crn].is_scheduled;
                        c.time=c.time_slot;
                        c.inst_name=c.name;
                        delete c.time_slot;
                        c.name=temp_classes[i];
                        c.color=scheduled_classes[c.crn].color;
                        }
                        final_data=final_data.concat(section_data);
                    }
                    MyData.all_courses=final_data;
                    MyData.classes=temp_classes;

                    }
                    */
                    localStorage.setItem("version",version);
                    console.log("delete");
                    clearData();
                    saveData();
                }
                else{

                    var temp_courses=JSON.parse(localStorage.getItem("all_courses"));
                    if(temp_courses!=null){
                        var temp_classes=JSON.parse(localStorage.getItem("classes"));
                        var scheduled_classes={};

                        for(var i=0;i<temp_courses.length;i++){
                            var c=temp_courses[i];
                            scheduled_classes[c.crn]={is_scheduled:c.is_scheduled,color:c.color};
                        }
                        var final_data=[];
                        $("#load-message").text("Updating Courses...");
                        for(var i=0;i<temp_classes.length;i++){
                            var section_data=rest("GET",'/courses/getSections/'+temp_classes[i], {});
                            for(var j=0;j<section_data.length;j++){
                                var c=section_data[j];
                                if(!(c.crn in scheduled_classes)){
                                    continue;
                                }
                                c.is_scheduled=scheduled_classes[c.crn].is_scheduled;
                                c.time=c.time_slot;
                                c.inst_name=c.name;
                                delete c.time_slot;
                                c.name=temp_classes[i];
                                c.color=scheduled_classes[c.crn].color;
                            }
                            final_data=final_data.concat(section_data);
                        }
                        MyData.all_courses=final_data;
                        MyData.classes=temp_classes;
                    }
                    saveData();
                }

            }

        }

        if(localStorage.getItem("all_courses")){
            MyData.all_courses=JSON.parse(localStorage.getItem("all_courses"));
        }
    }

    if(MyData.all_courses.length>0){
        if(MyData.isLocalDataStorage){
            if(localStorage.getItem("unused_colors")){
                MyData.unUsedColors=JSON.parse(localStorage.getItem("unused_colors"));
            }
        }
        MyData.classes=getClasses(MyData.all_courses);
        $("#add-major").css("border-bottom","none");
        $("#add-major").css("padding-bottom","0px");
        $("#add-course").css("display","block");
        $("#scheduler-divider").css("display","block");
        $("#sections").empty();
        $("#add-course").css("border-bottom","none");
        $("#add-course").css("padding-bottom","0px");
        var course_id;
        for(var i=0;i<MyData.classes.length;i++){
            course_id=MyData.classes[i];

            $("#course-list").append("<div id='"+removeSpaceFromClass(course_id)+"' class='course'>"+course_id+"<img id='palette' style='width:24px;position:absolute;right:35px;' src='/assets/blank.png'><img id='trash' style='width:24px;position:absolute;right:5px;' src='/assets/delete_unscheduled.png'></div>");

        }

        if(MyData.classes.length>0){
            setCurClass(MyData.classes[0]);
            displaySections(removeSpaceFromClass(MyData.classes[0]));

        }
        var scheduled=allScheduled();
        for(var i=0;i<scheduled.length;i++){
            var element=$('#'+removeSpaceFromClass(scheduled[i].name)).detach();
            var current=scheduled[i];
            scheduleSection(element);
            element.css('background-color',current.color);
            editCredits(Number(scheduled[i].credits));
            $('#scheduled').append(element);
        }

    }

}

function saveData(){
    if(MyData.isLocalDataStorage){
        localStorage.setItem("all_courses",JSON.stringify(MyData.all_courses));
        localStorage.setItem("unused_colors",JSON.stringify(MyData.unUsedColors));
        localStorage.setItem("classes",JSON.stringify(MyData.classes));
    }
}

function clearData(){
    MyData.all_courses=[];
    MyData.classes=[];
}

function exportCRNS(){
    $('.header').text("CRN Export");
    showExport();
    var courses=[];
    var scheduled=[];
    if(MyData.screen=="courses"){
        var temp=allScheduled();
        for(var i in temp){
            courses.push(temp[i].crn);
        }
        scheduled=temp;
    }
    else{
        var search=window.location.search;
        var index=1;
        var cur=getUrlParameter("crns[0]");
        while(cur!==undefined){
            courses.push(cur);
            cur=getUrlParameter("crns["+index+"]");
            index++;
        }
        scheduled=MyData.events_share;
    }
    hideAll();
    $('#copy').show();
    $('#crnlist').show();
    printCRNS(courses);
    generateCRNList(scheduled);
}

function contact(){
    showExport();
    hideAll();
    $('#contact').show();
    $('.header').text("Contact");
}

function chooseColor(){
    showExport();
    hideAll();
    $('.header').text("Choose Color");
    $('#colors').show();
}

function help(){
    showExport();
    hideAll();
    $('#help').show();
    $('.header').text("Help");
}

function share(){
    showExport();
    hideAll();
    var url = generateShareURL();
    $('#share-crns').text(url);
    $('#share').show();
    $('.header').text("Share Classes");
}

function patreon(){
    showExport();
    hideAll();
    $('#patreon').show();
    $('.header').text("Patreon");
    printPatrons();
}

function hideAll(){
    $('#crnlist').hide();
    $('#copy').hide();
    $('#contact').hide();
    $('#colors').hide();
    $('#help').hide();
    $('#share').hide();
    $("#patreon").hide();
}


function getClasses(courses){
    if(courses.length<1)
        return;
    var classes=[];
    var cur='';
    for(course in courses){

        if(courses[course].name!=cur){
            cur=courses[course].name;
            classes.push(cur);
        }
    }
    return classes;
}



function printCRNS(crns){
    $("#crn-box").val('');
    var breakSymbol="\n";
    if($(window).width()<500){
        breakSymbol="\n"
    }
    else{
        breakSymbol="\t"
    }
    for(var i=0;i<crns.length;i++){
        $("#crn-box").val($("#crn-box").val()+crns[i]+breakSymbol);
    }
}

function printPatrons(){
    $("#patron-list").empty();
    var patrons=
        {
            "Maria Vargas":"2019'",
            "Mira Straathof":"2019'",
            "Will Peracchio":"2021'"
        };
    for (var name in patrons) {
        $("#patron-list").append("<div class='patron left'>"+name+"</div>");
        $("#patron-list").append("<div class='patron right'>"+patrons[name]+"</div>");
    }
}

function showExport(){
    $("#cover").css("z-index","999");
    $("#dim").css("z-index","999");
    $("#export").css("z-index","999");
    $("#calendar-container").css("z-index","-1");
    $("#dim").css("display","block");
    $("#dim").animate({opacity: .5}, 200);
    $("#export").css("display","block");
    $("#export").animate({opacity: 1}, 400);
    $(".header").css("display","block");
    $(".header").animate({opacity: 1}, 500);

}

function hideExport(){
    $("#dim").css("display","none");
    $("#export").css("display","none");
    $(".header").css("display","none");
    $("#dim").css("opacity","0");
    $("#export").css("opacity","0");
    $(".header").css("opacity","0");
    $("#dim").css("z-index","-1");
    $("#export").css("z-index","-1");
    $("#cover").css("z-index","-1");
    $("#calendar-container").css("z-index","999");
}

function displayEmail(email,name){

    if($("#"+name).text()==email)
    {
        if(email=="jonathanwu70@gmail.com"){
            $("#"+name).stop().fadeOut(200,function(){
                $("#"+name).text("Jonathan Wu");
                $("#"+name).fadeIn(150);
            });
        }
        else{
            $("#"+name).stop().fadeOut(150,function(){
                $("#"+name).text("Kento Hirakawa");
                $("#"+name).fadeIn(150);
            });
        }
    }
    else{
        $("#"+name).stop().fadeOut(150,function(){
            $("#"+name).text(email);
            $("#"+name).fadeIn(150);
        });
    }
};

function rest(verb, url, data){
    if((verb=="PUT"||verb=="POST")&&!MyData.isLoggedIn)
        return;
    var val=[];
    $.ajax({
        async:false,
        type: verb,
        url: url,
        data: data,
        success:function(res){

            val=res;
        },
        contentType: "application/json",
        dataType: 'json'
    });
    return val;
}


function createAllCalendarEvents(){
    for(var i=0;i<MyData.all_courses.length;i++){
        if(MyData.all_courses[i].is_scheduled==1){
            createCalendarEvents(MyData.all_courses[i].crn);
        }
    }
}

function createShareEvent(crn){
    var className=crn.course_id+" - "+crn.sec_id;
    var color=crn.color;

    var times=[];
    times=crn.time_slot.split('\n');
    times.pop();

    for(var a=0;a<times.length;a++){
        var start;
        var end;
        var dow=[];
        var time;
        time=times[a];
        start=time.split(' ')[0];
        start=moment(start, 'h:mm a').format('H:mm');
        end=time.split(' ')[2];
        end=moment(end, 'h:mm a').format('H:mm');
        var days=time.split(' ')[3];
        for(var j=0;j<dayLetters.length;j++){
            for(var k=1;k<days.length;k++){
                if(dayLetters[j]==days.substring(k,k+1)){
                    dow.push(j+1);
                }
            }

        }

        var event={
            id:crn.crn,
            title:className,
            start: start,
            end: end,
            dow: dow,
            color:color
        };
        $('#calendar-share').fullCalendar( 'renderEvent', event, true);
    }

}
function createCalendarEvents(crn){
    for(var i=0;i<MyData.all_courses.length;i++){
        if(MyData.all_courses[i].crn==crn){
            var className=MyData.all_courses[i].name+" - "+MyData.all_courses[i].sec_id;
            var color=MyData.all_courses[i].color;
            var seats="N/A";
            if ('seats' in MyData.all_courses[i]) {
                seats=MyData.all_courses[i].seats;
            }
            var times=MyData.all_courses[i].time.split('\n');
            times.pop();
            for(var a=0;a<times.length;a++){
                var start;
                var end;
                var dow=[];
                time=times[a];
                start=time.split(' ')[0];
                start=moment(start, 'h:mm a').format('H:mm');
                end=time.split(' ')[2];
                end=moment(end, 'h:mm a').format('H:mm');
                var days=time.split(' ')[3];
                for(var j=0;j<dayLetters.length;j++){
                    for(var k=1;k<days.length;k++){
                        if(dayLetters[j]==days.substring(k,k+1)){
                            dow.push(j+1);
                        }
                    }

                }
                var event={
                    id:crn,
                    title:className,
                    start: start,
                    end: end,
                    dow: dow,
                    tip: 'Personal tip 1',
                    color:color,
                    seats: seats
                };
                $('#calendar').fullCalendar( 'renderEvent', event, true);
            }

        }
    }
}

function nextUnscheduled(){
    if ( $('#course-list').children().length < 0 || MyData.all_courses.length==0) {
        return false;
    }
    var cur=MyData.all_courses[0].name;
    var sched=false;
    for(var i=0;i<MyData.all_courses.length;i++){

        if(MyData.all_courses[i].is_scheduled==0)
        {
            if(cur!=MyData.all_courses[i].name&&!sched)
            {
                return MyData.all_courses[i];
            }

        }
        else{
            sched=true;
        }
        cur=MyData.all_courses[i];
    }
    return false;
}

function generateCRNList(courses){
    $("#crn-full").empty();
    $("#crn-full").append("<div class='crn-section'>Courses</div>");
    for(var i=0;i<courses.length;i++){
        $("#crn-full").append("<div style='border-left:solid 3px "+courses[i].color+";' class='crn-section'><b>"+courses[i].crn+"</b> "+courses[i].name+"-"+courses[i].sec_id +"</div>");
    }
}

function generateShareURL(){
    var url="www.ezsemester.com/share?";
    var studentName=$("#student-name").text().split(" ")[0];
    var courses=allScheduled();
    for(var i=0;i<courses.length;i++){
        url+="crns["+i+"]="+courses[i].crn+"&";

    }
    url+="sharedFrom="+studentName;
    return url;
}


function removeItem(array,item){
    for(var i = array.length; i--;) {
        if(array[i] === item) {
            array.splice(i, 1);
        }
    }
    return array;
}

function displaySections(course_id){

    course_id=addSpaceToClass(course_id);
    var sectionData=loadSections(course_id);
    $('#sections').empty();
    var thisClass="";
    var courseNames=[];
    var curProf="";
    for(var a=0;a<sectionData.length;a++){
        if(curProf!=sectionData[a].inst_name){
            curProf=sectionData[a].inst_name;
            if(sectionData[a].rating==null){
                $("#sections").append("<div class='accordion professor' id='"+removeSpace(curProf)+"'>"+curProf+"</div>");
            }
            else if(sectionData[a].rating>=3.5){
                $("#sections").append("<div class='accordion professor' id='"+removeSpace(curProf)+"'>"+curProf+"<a href='http:\
\
\
//www.ratemyprofessors.com/ShowRatings.jsp?tid="+sectionData[a].tid+"' target='_blank'><img class='ra\
te-prof' id='"+sectionData[a].tid+"' src='assets/good.png'></a></div>");
            }
            else if(sectionData[a].rating<=3.4&&sectionData[a].rating>=2.5){
                $("#sections").append("<div class='accordion professor' id='"+removeSpace(curProf)+"'>"+curProf+"<a href='http:\
//www.ratemyprofessors.com/ShowRatings.jsp?tid="+sectionData[a].tid+"' target='_blank'><img class='ra\
te-prof' id='"+sectionData[a].tid+"' src='assets/average.png'></a></div>");
            }
            else if(sectionData[a].rating>=0&&sectionData[a].rating<=2.4){
                $("#sections").append("<div class='accordion professor' id='"+removeSpace(curProf)+"'>"+curProf+"<a href='http:\
\
\
//www.ratemyprofessors.com/ShowRatings.jsp?tid="+sectionData[a].tid+"' target='_blank'><img class='ra\
te-prof' id='"+sectionData[a].tid+"' src='assets/poor.png'></a></div>");
            }
            else if(sectionData[a].rating<0){
                $("#sections").append("<div class='accordion professor' id='"+removeSpace(curProf)+"'>"+curProf+"<a href='http:\
\
//www.ratemyprofessors.com/ShowRatings.jsp?tid="+sectionData[a].tid+"' target='_blank'><img class='ra\
te-prof' id='"+sectionData[a].tid+"' src='assets/na.png'></a></div>");
            }

            $("#"+removeSpace(curProf).replace(".","\\.").replace(/'/g, "")).prepend("<div class='folder-padding'><div class='folder'></div></div>");

        }
        if(thisClass!=sectionData[a].title){
            courseNames.push(sectionData[a].title);
            thisClass=sectionData[a].title;
        }
        var newTimes=sectionData[a].time.substring(0,sectionData[a].time.length-1).replace("\n","</br>&nbsp;&nbsp;&nb\
sp;&nbsp;&nbsp;&nbsp;");
        for(var s=0;s<newTimes.length;s++){
            if(s<newTimes.length-2){
                if(newTimes.substring(s,s+2)=="am"){
                    newTimes=newTimes.substring(0,s)+"AM"+newTimes.substring(s+2,newTimes.length);
                }
                else if(newTimes.substring(s,s+2)=="pm"){
                    newTimes=newTimes.substring(0,s)+"PM"+newTimes.substring(s+2,newTimes.length);
                }
            }
        }
        $("#sections").append("<div class='panel no-select-mobile' id='"+sectionData[a].crn+"'><div class='section-text'><b>"+sectionData[a].sec_id+"</b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"+newTimes+"</div></div>");
        if(sectionData[a].is_scheduled===1){
            var select=$("#"+sectionData[a].crn);
            $("#"+sectionData[a].crn).css("border-left","4px solid "+sectionData[a].color);
            select.append("<div class='room-text'><b>Room&nbsp;-</b>&nbsp;"+sectionData[a].room+"</div>");
            select.css("height",65);
        }
    }
    if(courseNames.length>1){
        $(".panel").each(function(){
            var course=MyData.all_courses[getCourse($(this).attr("id"))];
            if(course.is_scheduled==1){
                $(this).css("height",85);
            }
            else{
                $(this).css("height",65);
            }
            $(this).prepend("<div class='title-text'><b>"+course.title+" ("+course.credits+")</b></div>");
        });
    }
    setCollapseProf();
    $("#course-name").show();
}



function loadImages(){
    $.get("/assets/delete_scheduled.png");
    $.get("/assets/delete_unscheduled.png");
    $.get("/assets/unscheduled_palette.png");
    $.get("/assets/scheduled_palette.png");
    $.get("/assets/whitearrow.png");
    $.get("/assets/close.png");
    $.get("/assets/copy.png");
}


function setCurClass(curClass){
    curClass=$.trim(curClass);
    changeHeaderText("Select Section from "+curClass);
    var course=removeSpaceFromClass(curClass);
    MyData.curClass=curClass;
    $(".course").css('box-shadow','0 4px 2px rgba(0, 0, 0, 0.26)');
    $("#"+course).css('box-shadow','none');
    $("#course-name-left").text(curClass);
    var sections=loadSections(curClass);
    if(sections.length>0){
        var thisClass=sections[0].title;
        var multi=false;
        for(var i=0;i<sections.length;i++){
            if(thisClass!=sections[i].title){
                thisClass=sections[i].title;
                multi=true;
                break;
            }
        }
        if(multi){
            if(sections[0].course_desc!==null){
                updateCourseDesc(sections[0].course_desc,"N/A","Multiple Course Names");
            }
            else{
                updateCourseDesc("No Course Description","N/A","Multiple Course Names");
            }
        }
        else{
            if(sections[0].course_desc!==null){
                updateCourseDesc(sections[0].course_desc,sections[0].credits,sections[0].title);
            }
            else{
                updateCourseDesc("No Course Description",sections[0].credits,sections[0].title);
            }
        }
    }
}


function removeSpace(word){
    return word.split(' ')[0]+word.split(' ')[1];
}

function removeSpaceFromClass(course_id){
    return course_id.split(' ')[0]+course_id.split(' ')[1];
}

function addSpaceToClass(course_id){
    return course_id.substring(0,course_id.length-3)+" "+course_id.substring(course_id.length-3,course_id.length);
}

function updateCourseDesc(desc,credits,title){
    var course_desc=desc.split("\n");
    var reqs="";
    var full="</br>";
    reqs+=course_desc[0];
    if(credits=="N/A")
        credits="Listed Below";
    for(var i=1;i<course_desc.length;i++){
        if(course_desc[i].includes("Prerequisites: "))
        {
            var length="Prerequisites: ".length;
            full+="<b>"+course_desc[i].substring(0,length)+"</b>"+course_desc[i].substring(length,course_desc[i].length)+"</br>";
        }
        if(course_desc[i].includes("Can be taken Concurrently: ")){
            var length="Can be taken Concurrently: ".length;
            full+="<b>"+course_desc[i].substring(0,length)+"</b>"+course_desc[i].substring(length,course_desc[i].length)+"</br>";
        }
    }
    $("#course-desc").text(reqs);
    $("#course-desc").prepend("<b>Credits: "+credits+"</b></br>");
    $("#course-desc").prepend("<b>"+title+"</b></br>");
    $("#course-desc").append(full);
}



function hexToRgb(hex) {
    if(hex.substring(0,1)=='#')
        hex=hex.substring(1,hex.length);
    var bigint = parseInt(hex, 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;

    return "rgba("+r + "," + g + "," + b + ",1)" ;
}


function isAnythingScheduled(){
    for(var i=0;i<MyData.all_courses.length;i++){
        if(MyData.all_courses[i].is_scheduled==1)
            return true;
    }
    return false;
}

function checkIsScheduled(name){
    for(var i=0;i<MyData.all_courses.length;i++){
        if(MyData.all_courses[i].name==name&&MyData.all_courses[i].is_scheduled==1)
            return true;
    }
    return false;
}

function allScheduled(){
    var scheduled=[];
    for(var i=0;i<MyData.all_courses.length;i++){
        if(MyData.all_courses[i].is_scheduled==1)
            scheduled.push(MyData.all_courses[i]);
    }
    return scheduled;
}


function loadSections(className){
    var courses=[];

    for(var i=0;i<MyData.all_courses.length;i++){
        if(MyData.all_courses[i].name===className){

            courses.push(MyData.all_courses[i]);
        }
    }

    return courses;
}



function removeSections(className){
    for(var i = MyData.all_courses.length; i--;) {
        if(MyData.all_courses[i].name === className) {
            MyData.all_courses.splice(i, 1);
        }
    }
    return MyData.all_courses;
}
function getCourse(crn){
    for(var i=0;i<MyData.all_courses.length;i++){
        if(MyData.all_courses[i].crn==crn)
            return i;
    }
    return -1;
}

function getTakes(takes,crn){
    for(var i=0;i<takes.length;i++){
        if(takes[i][1]===crn)
        {
            return takes[i];
        }
    }
    return false;
}
function setCourseColor(color){
    $('#'+removeSpaceFromClass(MyData.colorClass)).css('background-color',color);
    for(var i=0;i<MyData.all_courses.length;i++){
        if(MyData.all_courses[i].name==MyData.colorClass){
            MyData.all_courses[i].color=color;
            if(MyData.all_courses[i].is_scheduled==1){
                $('#calendar').fullCalendar('removeEvents',MyData.all_courses[i].crn);
                createCalendarEvents(MyData.all_courses[i].crn);
                colorSection($('#'+MyData.all_courses[i].crn),MyData.all_courses[i]);
            }
        }
    }
    var this_data=loadSections(MyData.colorClass);

    var crns=[];
    for(var i in this_data){
        crns.push(this_data[i].crn);
    }
    rest('PUT','/student/changeColor',JSON.stringify({
        crns:crns,
        semester:this_data[0].semester,
        year:this_data[0].year,
        hex_color:this_data[0].color
    }));
    saveData();
    hideExport();
}


function colorSection(cur,curSection){
    cur.css('border-left','solid 4px '+curSection.color);
}

function removeCreditsFromClass(className){
    var scheduled=allScheduled();
    for(var i=0;i<scheduled.length;i++){
        if(scheduled[i].name==className){
            editCredits(-1*Number(scheduled[i].credits));
        }
    }


}

function changeHeaderText(text){
    if(text.indexOf("Select Section from")>-1&&text.length>"Select Section from".length){
        if((($(window).width()>500&&$(window).width()<800)||$(window).width()>=1200)){
            if(MyData.all_courses.length>0){
                $("#add-header span").text(text);
            }
        }
        else{
            if(MyData.all_courses.length>0){
                $("#add-header span").text("Select Section");
            }
        }
    }
    else{
        $("#add-header span").text(text);
    }
}

function scheduleSection(element){

    if(isAnythingScheduled()){
        $("#scheduled").css("border-bottom","1px solid #9e9e9e");
    }
    element.css('color','#fff');
    element.find('img#trash').attr('src','/assets/delete_scheduled.png');
    element.find('img#palette').attr('src','/assets/scheduled_palette.png');

}

function editCredits(current){
    var credits=Number($(".credits").text().split(":")[1]);
    $(".credits").text("Total Credits: "+(credits+current));

}

function setDesc(){
    var acc = document.getElementsByClassName("accordion");
    if(acc.length<1)
        return;
    var i;
    $("#course-name").hide();
    $("#course-desc").hide();
    acc[0].onclick = function(e){
        this.classList.toggle("active");
        $("#desc-expand").toggleClass("rotate");
        $("#course-desc").toggle("show");
    }
}

function setCollapseProf(){
    var acc = document.getElementsByClassName("accordion");
    var i;
    for (i = 1; i < acc.length; i++) {
        acc[i].onclick = function(e){
            if ((e.target !== this && $(e.target).hasClass('folder') && $(e.target).hasClass('folder-padding')) || $(e.target).hasClass('rate-prof'))
                return;
            this.classList.toggle("active");
            $(this).children(":first").children(":first").toggleClass("spin-folder");

            var cur=$(this).next();

            while(!cur.hasClass("accordion")){
                cur.toggle("show");
                cur.css("display","flex");
                if($("#sections").children().last()[0].id==cur[0].id){
                    break;
                }

                cur=cur.next();
            }

        }
    };
    for (i = 1;i < acc.length;i++){
        var cur=$(acc[i]).next();
        var isExpanded=false;

        while(!cur.hasClass("accordion")){

            if(MyData.all_courses[getCourse(cur[0].id)].is_scheduled===1)
            {
                isExpanded=true;
            }
            if($("#sections").children().last()[0].id==cur[0].id){
                break;
            }
            cur=cur.next();
        }
        if(isExpanded){

            acc[i].classList.toggle("active");
            $(acc[i]).children(":first").children(":first").toggleClass("spin-folder");
            var cur=$(acc[i]).next();

            while(!cur.hasClass("accordion")){
                cur.hide();
                cur.toggle("show");
                cur.css("display","flex");

                if($("#sections").children().last()[0].id==cur[0].id){
                    break;
                }

                cur=cur.next();
            }
        }
    }
}

function isLocalStorageNameSupported() {
    var testKey = 'test', storage = localStorage;
    try {
        storage.setItem(testKey, '1');
        storage.removeItem(testKey);
        return true;
    } catch (error) {
        return false;
    }
}

function getRandomColor(colors){
    return colors[Math.floor(Math.random()*colors.length)];
}

function idGenerator() {
    var S4 = function() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+S4()+S4()+S4()+S4()+S4()+S4());
}

function rgb2hex(rgb){
    rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
    return (rgb && rgb.length === 4) ? "#" +
        ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
        ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
        ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : '';
}


var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};
