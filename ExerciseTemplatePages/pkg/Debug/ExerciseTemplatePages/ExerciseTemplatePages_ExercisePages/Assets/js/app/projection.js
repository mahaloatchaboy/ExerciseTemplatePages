﻿define(function (require) {

    //dependencies
    var $ = require('jquery'),
        commonUI = require('app/commonUI'),
    	commsTables = require('app/commsTables'),
        datatables = require('datatablesGrouped'),
        moment = require('moment'),
        timeago = require('timeago'),
        underscore = require('underscore');

    //configure dependencies before use (probably should centralize)
    jQuery.timeago.settings.allowFuture = true;

    //DOM--VERIFIED--APPEARS IN .master of BOTH SP2010 & SP2013
    var anchorMain = $("a[name='mainContent']");




    var exposedAPI = {
        render: render
    }

    function render(data) {
        var container = $('#currentOpsSummary');

        renderCCIRTable(container, data.ccirData);
        renderWatchlogTable(container, data.watchlogData);
        renderBattleRhythmTable(container, data.battleRhythmData);
        renderMessageTrafficTable(container, data.inboundMessageData, "Inbound Message Traffic", "tblInboundMessages");
        renderMessageTrafficTable(container, data.outboundMessageData, "Outbound Message Traffic", "tblOutboundMessages");
        renderMissionTrackerTable(container, data.missionData);

        commonUI.renderWebPartHeaderTag(container, "/Lists/CommunicationsStatus/EditableGrid.aspx", "Overall Communication Status");
        commsTables.renderCommsTable(container, data.commsData);

        renderRfiTable(container, data.rfiData);
    }

    function renderBattleRhythmTable(container, data) {
        //DataTables configurations
        var columns = [
            { title: "Start", width: "1%" },
            { title: "End", width: "1%" },
            { title: "Title" },
            { title: "Comments" }
        ];

        var timeagoColumDef = {
            render: function (battleRhythmEvent, type, dataRow) {
                var columnOutput = '',
                    startMoment = battleRhythmEvent.eventDate,
                    verb = (startMoment > moment()) ? "will start" : "started",
                    timePortion = startMoment.format("HHmm"),
                    isoString = startMoment.utc().format("YYYY-MM-DDTHH:mm:ss") + "Z";


                if (!!battleRhythmEvent.location) {
                    columnOutput += "Location: " + battleRhythmEvent.location + ", ";
                }
                columnOutput += verb + ' <abbr class="timeago" style="white-space:nowrap;" title="' + isoString + '">' + timePortion + '</abbr>';

                return columnOutput;
            },
            targets: 3
        };


        var dtSource = _.map(data, function (item, index) {
            var strArr = [];

            strArr.push(item.eventDate.format("HHmm"));
            strArr.push(item.endDate.format("HHmm"));
            strArr.push(item.title);
            strArr.push(item);

            return strArr;
        });

        commonUI.renderWebPartHeaderTag(container, requirejs.spWebURL + "/Lists/ExerciseCalendar", "Battle Rhythm (Next 24 Hours)");
        container.append($("<table id='tblBattleRhythm' cellpadding='0' cellspacing='0' border='0' class='hover row-border' width='100%'></table>"));

        $("#tblBattleRhythm").dataTable({
            paging: false,
            info: false,
            searching: false,
            ordering: false,
            data: dtSource,
            columns: columns,
            columnDefs: [timeagoColumDef]
        });

        $("#tblBattleRhythm abbr.timeago").timeago();
    }

    function renderCCIRTable(container, data) {
        //DataTables configurations
        var columns = [
            { title: "Category" },
            { title: "Requirement", width: "1%" },
            { title: "Status", width: "1%" },
            { title: "Title" }
        ];

        var kpiColumDef = {
            render: function (data, type, row) {
                /*
                /_layouts/images
                /_layouts/15/images
                kpinormallarge-0.gif maps to green
                kpinormallarge-1.gif maps to yellow
                kpinormallarge-2.gif maps to red
                */

                if (data === "Green") {
                    return '<i style="color:green;" class="fa fa-circle fa-2x"></i> ';
                } else if (data === "Yellow") {
                    return '<i style="color:yellow;" class="fa fa-circle fa-2x"></i> ';
                } else if (data === "Red") {
                    return '<i style="color:red;" class="fa fa-circle fa-2x"></i> ';
                }
                
            },
            targets: 2
        };



        var dtSource = _.map(data, function (item, index) {
            var strArr = [];

            var req = item.category.charAt(0) + item.number;
            strArr.push(item.category);
            strArr.push(req);
            strArr.push(item.status);
            strArr.push(item.title);

            return strArr;
        });

        commonUI.renderWebPartHeaderTag(container, requirejs.spWebURL + "/Lists/CCIR", "CCIR");
        container.append($("<table id='tblCCIR' cellpadding='0' cellspacing='0' border='0' class='hover row-border' width='100%'></table>"));

        $("#tblCCIR").dataTable({
            paging: false,
            info: false,
            searching: false,
            ordering: false,
            data: dtSource,
            columns: columns,
            columnDefs: [kpiColumDef]
        })
        .rowGrouping({ bExpandableGrouping: true });
    }

    function renderMessageTrafficTable(container, data, headingName, tableID) {
        //DataTables configurations
        var columns = [
            { title: "DateTimeGroup(hidden for sorting purposes)", visible: false },
            { title: "DTG//ORG//TITLE" },
            { title: "Task/Info" },
            { title: "Initials", width: "1%" }
        ];

        var dtSource = _.map(data, function (item, index) {
            var strArr = [];

            strArr.push(item.dateTimeGroup);
            strArr.push(item.dtgOrgTitle);
            strArr.push(item.taskInfo);
            strArr.push(item.initials);

            return strArr;
        });

        commonUI.renderWebPartHeaderTag(container, requirejs.spWebURL + "/Lists/MessageTraffic", headingName);
        container.append($("<table id='"+tableID+"' cellpadding='0' cellspacing='0' border='0' class='hover row-border' width='100%'></table>"));

        $("#" + tableID).dataTable({
            paging: true,
            info: true,
            searching: true,
            ordering: true,
            data: dtSource,
            columns: columns,
            columnDefs: [
                { "iDataSort": 0, "aTargets": [1] } //when sorting the second column, rely on value in first column instead
            ]
        });
    }

    function renderMissionTrackerTable(container, data) {
        //DataTables configurations
        var columns = [
            { title: "Status" }, //GROUPBY COL
            { title: "Mission#" },
            { title: "Title" },
            { title: "Expected Execution", width: "1%" },
            { title: "Expected Termination", width: "1%" },
            { title: "Comments" }
        ];

        var dtSource = _.map(data, function (item, index) {
            var strArr = [];

            var execution = item.expectedExecution.isValid() ?
                item.expectedExecution.format("M/D/YYYY") : "";

            var termination = item.expectedTermination.isValid() ?
                item.expectedTermination.format("M/D/YYYY") : "";

            strArr.push(item.status);
            strArr.push(item.missionNumber);
            strArr.push(item.title);
            strArr.push(execution);
            strArr.push(termination);
            strArr.push(item.comments);
            return strArr;
        });

        commonUI.renderWebPartHeaderTag(container, requirejs.spWebURL + "/Lists/MissionTracker", "Mission Tracker");
        container.append($("<table id='tblMissionTracker' cellpadding='0' cellspacing='0' border='0' class='hover row-border' width='100%'></table>"));

        $("#tblMissionTracker").dataTable({
            paging: false,
            info: false,
            searching: false,
            ordering: true,
            data: dtSource,
            columns: columns
        })
        .rowGrouping({ bExpandableGrouping: true });
    }

    function renderRfiTable(container, data) {
        //DataTables configurations
        var columns = [
            { title: "POC Organization" },
            { title: "RFI Tracking", width: "1%" },
            { title: "Title" },
            { title: "LTIOV" },
            { title: "Priority" },
            { title: "Date Opened"}
        ];


        var dtSource = _.map(data, function (item, index) {
            var strArr = [];

            var ltiov = (item.ltiov.isValid()) ? item.ltiov.format("M/D/YYYY H:mm A") : "",
                dateOpened = (item.dateOpened.isValid()) ? item.dateOpened.format("M/D/YYYY H:mm A") : "";

            strArr.push(item.pocOrganization);
            strArr.push(item.rfiTracking);
            strArr.push(item.title);
            strArr.push(ltiov);
            strArr.push(item.priority);
            strArr.push(dateOpened);

            return strArr;
        });

        commonUI.renderWebPartHeaderTag(container, requirejs.spWebURL + "/Lists/RFI", "Open Collection Requirements");
        container.append($("<table id='tblRfi' cellpadding='0' cellspacing='0' border='0' class='hover row-border' width='100%'></table>"));

        $("#tblRfi").dataTable({
            paging: true,
            info: true,
            searching: true,
            ordering: true,
            data: dtSource,
            columns: columns
        });
    }

    function renderWatchlogTable(container, data) {
        //DataTables configurations
        var columns = [
            { title: "DateTimeGroup(hidden for sorting purposes)", visible: false },
            { title: "DTG", width: "1%" },
            { title: "Organization" },
            { title: "Event" },
            { title: "Action Taken" },
            { title: "Initials", width: "1%" }
        ];


        var dtSource = _.map(data, function (item, index) {
            var strArr = [];

            strArr.push(item.dateTimeGroup);
            strArr.push(item.dtg);
            strArr.push(item.organization);
            strArr.push(item.title);
            strArr.push(item.actionTaken);
            strArr.push(item.initials);

            return strArr;
        });

        commonUI.renderWebPartHeaderTag(container, requirejs.spWebURL + "/Lists/WatchLogSocc", "Watch Log");
        container.append($("<table id='tblWatchLog' cellpadding='0' cellspacing='0' border='0' class='hover row-border' width='100%'></table>"));

        $("#tblWatchLog").dataTable({
            paging: true,
            info: true,
            searching: true,
            ordering: true,
            data: dtSource,
            columns: columns,
            columnDefs: [
                { "iDataSort": 0, "aTargets": [1] } //when sorting the second column, rely on value in first column instead
            ]
        });
    }

    return exposedAPI;
});
