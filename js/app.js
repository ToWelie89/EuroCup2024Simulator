import {
    teams,
    groupNames,
    knockoutPhaseNumberMatrix,
    TEAMS_PER_GROUP,
    knockOutPhases,
    thirdPlaceCombinationMatrix,
    getMatchResults
} from './constants';

/*************************
    INITIALIZATION
*************************/

const data = {};
let idVariable;

$(document).ready(() => {
    // Fetch current version from package.json
    fetch('./package.json')
    .then((resp) => resp.json())
    .then((data) => {
        $('#version').text(data.version);
    });

    initializeGroups();
    initializeGroupTables();
    initializeMatches();
    calculateThirdPlaces();

    // Set listeners
    $('#randomizeGroupsButton').click((index, element) => randomize(false));
    $('#randomizeAllButton').click((index, element) => randomize(true));

    $('#getMatchesButton').click(() => {
        startLoader();
        getMatchResults().then(matches => {
            console.log(matches);
            matches.forEach(match => {
                if (match.phase === 'groupPhase') {
                    [...document.querySelectorAll('.groupMatchesTable tr:not(.groupTitleRow)')].forEach(row => {
                        const team1name = row.querySelector('td:nth-child(1) p').innerText;
                        const team2name = row.querySelector('td:nth-child(5) p').innerText;
    
                        let rowFound = false;
    
                        if (team1name.includes(match.team1) && team2name.includes(match.team2)) {
                            row.querySelector('td:nth-child(2) input').value = match.team1score;
                            row.querySelector('td:nth-child(4) input').value = match.team2score
                            rowFound = true;
                        } else if ((team1name.includes(match.team2) && team2name.includes(match.team1))) {
                            row.querySelector('td:nth-child(4) input').value = match.team1score;
                            row.querySelector('td:nth-child(2) input').value = match.team2score;
                            rowFound = true;
                        }
    
                        if (rowFound) {
                            $(row.querySelector('td:nth-child(4) input')).keyup();
                        }
                    });
                } else if (match.phase === 'knockoutPhase') {
                    [16, 8, 4, 2].forEach((round, index) => {
                        setTimeout(() => {
                            for (let i = 1; i <= round; i += 2) {
                                const cell1 = document.querySelector(`td.knockoutPhaseCell\#ro${round}nr${i}`);
                                const cell2 = document.querySelector(`td.knockoutPhaseCell\#ro${round}nr${i+1}`);
    
                                const team1name = cell1.querySelector('div span').innerText;
                                const team2name = cell2.querySelector('div span').innerText;
    
                                let rowFound = false;
            
                                if (team1name.includes(match.team1) && team2name.includes(match.team2)) {
                                    cell1.querySelector('input').value = match.team1score;
                                    cell2.querySelector('input').value = match.team2score
                                    rowFound = true;
                                } else if ((team1name.includes(match.team2) && team2name.includes(match.team1))) {
                                    cell2.querySelector('input').value = match.team1score;
                                    cell1.querySelector('input').value = match.team2score;
                                    rowFound = true;
                                }
            
                                if (rowFound) {
                                    $(cell2.querySelector('input')).keyup();
                                }
                            }
                        }, index * 50);
                    });
                }
            });
            setTimeout(() => {
                stopLoader();
            }, 200);
        })
        .catch(e => {
            stopLoader();
            alert('error ' + e.message);
        });
    });
    $('#clearButton').click(() => {
        window.location.replace(window.location.href.split('?')[0]);
    });
    $('#restartButton').click(() => {
        window.location.replace(window.location.href.split('?')[0]);
    });

    $('.knockoutMatchScoreBox').keyup(knockoutPhaseKeyUp);

    $('#closeModal').click(() => {
        $('#tournamentCompleteContainer').css('display', 'none');
        $('#overlay').css('opacity', '0');
        $('#overlay').css('display', 'none');
    });

    $('#copyToClipboardButton').click(() => {
        const text = $('#codeTextArea').val();
        $('#codeTextArea').select();
        document.execCommand('copy');
    });

    idVariable = getParameterValueByKey('id');

    if (idVariable && idVariable.length > 0){
        loadDataFromId(idVariable);
    } else {
        document.querySelector('.matchScoreBox').focus();
    }
});

const getParameterValueByKey = parameterName => {
    const pageURL = window.location.href;
    let parameters = pageURL.split('?')[1];

    if (parameters) {
        parameters = parameters.split('&');
        for (let i = 0, max = parameters.length; i < max; i++) {
            const paramPair = parameters[i].split('=');
            if (paramPair[0] === parameterName) {
                return paramPair[1];
            }
        }
    }

    return null;
}

const initializeGroups = () => {
    data.groups = [];
    for (let i = 0; i < teams.length; i++) {
        let currentGroup;
        if (i % TEAMS_PER_GROUP == 0) {
            currentGroup = {};
            currentGroup.name = groupNames[(i / TEAMS_PER_GROUP)];
            currentGroup.teams = [];
        }
        else {
            currentGroup = data.groups[data.groups.length - 1];
        }
        const team = {
            name: teams[i].name,
            flag: teams[i].flag,
            mp: 0,
            w: 0,
            d: 0,
            l: 0,
            f: 0,
            a: 0,
            diff: 0,
            p: 0
        };
        currentGroup.teams.push(team);
        if (i % TEAMS_PER_GROUP == 0) {
            data.groups.push(currentGroup);
        }
    }
}

const initializeGroupTables = () => {
    let htmlString = `<div>`;
    for (let i = 0; i < data.groups.length; i++) {
        if (i == 0 || i == 3) {
            htmlString += `<tr>`;
        }
        htmlString += `<td>`;
        htmlString += `<div class="groupContainer" groupIndex="${i}">`;
        htmlString += `<table class="groupTable">`;
        htmlString += `<tr>`;
        htmlString += `<th id="groupIndexColumn" align="left"><p>#</p></th>`;
        htmlString += `<th id="groupTeamColumn" align="left"><p>Team</p></th>`;
        htmlString += `<th class="groupStatColumn" align="center"><p>MP</p></th>`;
        htmlString += `<th class="groupStatColumn" align="center"><p>W</p></th>`;
        htmlString += `<th class="groupStatColumn" align="center"><p>D</p></th>`;
        htmlString += `<th class="groupStatColumn" align="center"><p>L</p></th>`;
        htmlString += `<th class="groupStatColumn" align="center"><p>F</p></th>`;
        htmlString += `<th class="groupStatColumn" align="center"><p>A</p></th>`;
        htmlString += `<th class="groupStatColumn" align="center"><p>D</p></th>`;
        htmlString += `<th class="groupStatColumn" align="center"><p>P</p></th>`;
        htmlString += `</tr>`;
        htmlString += `<tbody id="groupTableBodyIndex${i}">`;
        for (let k = 0; k < data.groups[i].teams.length; k++) {
            if (k == 2) {
                htmlString += `<tr><td align="center" colspan="10"><div class="groupMiddleLine"></td></tr>`;
            }
            htmlString += `<tr>`;
            htmlString += `<td><p>${(k + 1)}</p></td>`;
            htmlString += `<td><img src="${data.groups[i].teams[k].flag}" alt="${data.groups[i].teams[k].name}" class="countryFlag" /><p>${data.groups[i].teams[k].name}</p></td>`;
            htmlString += `<td align="center"><p>${data.groups[i].teams[k].mp}</p></td>`;
            htmlString += `<td align="center"><p>${data.groups[i].teams[k].w}</p></td>`;
            htmlString += `<td align="center"><p>${data.groups[i].teams[k].d}</p></td>`;
            htmlString += `<td align="center"><p>${data.groups[i].teams[k].l}</p></td>`;
            htmlString += `<td align="center"><p>${data.groups[i].teams[k].f}</p></td>`;
            htmlString += `<td align="center"><p>${data.groups[i].teams[k].a}</p></td>`;
            htmlString += `<td align="center"><p>${data.groups[i].teams[k].diff}</p></td>`;
            htmlString += `<td align="center"><p>${data.groups[i].teams[k].p}</p></td>`;
            htmlString += `</tr>`;
        }
        htmlString += `</tbody>`;
        htmlString += `</table>`;
        htmlString += `</div>`;
        htmlString += `</td>`;
        if (i == 5) {
            htmlString += `</tr>`;
        }
    }
    htmlString += `</div>`;
    $('#groupTableContainers #inner').html(htmlString);
}

const initializeMatches = () => {
    for (let i = 0; i < data.groups.length; i++) {
        data.groups[i].matches = [];
    }

    data.groups.forEach(group => {
        for (let i = 0; i < group.teams.length; i++) {
            for (let j = 0; j < group.teams.length; j++) {
                if (i > j) group.matches.push({ 'team1': group.teams[i], 'team2': group.teams[j], 'team1score': -1, 'team2score': -1 });
            }
        }
    });

    let htmlString = `<div>`;
    let totalIndex = 1;
    for (let i = 0; i < data.groups.length; i++)
    {
        if (i == 0 || i == 3) {
            htmlString += `<tr>`;
        }
        htmlString += `<td>`;
        htmlString += `<div class="groupMatchesContainer" group="${data.groups[i].name}">`;
        htmlString += `<table class="groupMatchesTable">`;
        htmlString += `<tr class="groupTitleRow"><td colspan="5" align="center"><p class="groupTitle">Group ${data.groups[i].name}</p></td></tr>`;
        for (let k = 0; k < data.groups[i].matches.length; k++) {
            htmlString += `<tr>`;
            htmlString += `<td align="right"><p>${data.groups[i].matches[k].team1.name}</p><img src="${data.groups[i].matches[k].team1.flag}" class="countryFlag" alt="${data.groups[i].matches[k].team1.name}"></td>`;
            htmlString += `<td><input maxlength="1"  type="text" class="matchScoreBox match1" groupIndex="${i}" matchIndex="${k}" tabindex="${totalIndex}" /></td>`;
            htmlString += `<td><span class="matchLine"><p>-</p></span></td>`;
            totalIndex++;
            htmlString += `<td><input maxlength="1" type="text" class="matchScoreBox match2" groupIndex="${i}" matchIndex="${k}" tabindex="${totalIndex}" /></td>`;
            htmlString += `<td align="left"><img src="${data.groups[i].matches[k].team2.flag}" class="countryFlag" alt="${data.groups[i].matches[k].team2.name}"><p>${data.groups[i].matches[k].team2.name}</p></td>`;
            htmlString += `</tr>`;
            totalIndex++;
        }
        htmlString += `</table>`;
        htmlString += `</div>`;
        htmlString += `</td>`;
        if (i == 5) {
            htmlString += `</tr>`;
        }
    }
    htmlString += `</div>`;
    $('#groupMatchesContainers').html(htmlString);
    $('.matchScoreBox').keyup(setMatchScore);
}

/*************************
    EVENT HANDLERS
*************************/

function randomize(randomizeKnockoutPhase = false){
    startLoader();
    setTimeout(() => {
        $('#ro2nr1 i').css('visibility', 'hidden');
        $('#ro2nr2 i').css('visibility', 'hidden');
        $('.knockoutMatchScoreBox').val('');
        $('.knockoutMatchScoreBox').keyup();
        $('.matchScoreBox').each(function(){
            $(this).val(Math.floor((Math.random() * 5) + 1));
            $(this).keyup();
        });

        const randomValueThatIsNotX = x => {
            const val = Math.floor((Math.random() * 5) + 1);
            return val !== x ? val : randomValueThatIsNotX(x);
        }

        const generateKnockoutPhase = roundOf => {
            const values = [];
            for (let i = 0; i < roundOf; i++) {
                if (i % 2 === 0) {
                    values.push(Math.floor((Math.random() * 5) + 1));
                } else {
                    values.push(randomValueThatIsNotX(values[i - 1]));
                }
            }

            $(`.knockoutPhaseCell[round="${roundOf}"] .knockoutMatchScoreBox`).each(function(index){
                $(this).val(values[index]);
                $(this).keyup();
            });
        }

        if (randomizeKnockoutPhase) {
            generateKnockoutPhase(16);
            generateKnockoutPhase(8);
            generateKnockoutPhase(4);
            generateKnockoutPhase(2);
        }

        stopLoader();
    }, 50);
}

function startLoader() {
    $('#groupTableContainers').hide();
    $('#thirdPlaceGroup').hide();
    $('#groupMatchesContainers').hide();
    $('#knockOutPhaseTable').hide();
    $('#loader').show();
    $('body').css('cursor', 'wait');
}

function stopLoader() {
    $('#groupTableContainers').show();
    $('#groupMatchesContainers').show();
    $('#thirdPlaceGroup').show();
    $('#knockOutPhaseTable').show();
    $('#loader').hide();
    $('body').css('cursor', 'default');
}

function clearGroups(){
    $('.matchScoreBox').each(function(){
        $(this).val('');
        $(this).keyup();
    });
}

function setMatchScore(){
    const groupIndex = $(this).attr('groupIndex');
    const matchIndex = $(this).attr('matchIndex');
    const tabindex = Number($(this).attr('tabindex'));

    const team1box = $(`.match1[groupIndex="${groupIndex}"][matchIndex=${matchIndex}]`);
    const team2box = $(`.match2[groupIndex="${groupIndex}"][matchIndex=${matchIndex}]`);

    const team1score = team1box.val();
    const team2score = team2box.val();

    if (team1score != '' && team2score != '') {
        team1box.removeClass('validGradient invalidGradient');
        team2box.removeClass('validGradient invalidGradient');

        if (isNumber(team1score) && isNumber(team2score))
        {
            data.groups[groupIndex].matches[matchIndex].team1score = team1score;
            data.groups[groupIndex].matches[matchIndex].team2score = team2score;

            team1box.addClass('validGradient');
            team2box.addClass('validGradient');
        } else {
            team1box.addClass('invalidGradient');
            team2box.addClass('invalidGradient');
        }
    } else {
        data.groups[groupIndex].matches[matchIndex].team1score = -1;
        data.groups[groupIndex].matches[matchIndex].team2score = -1;

        team1box.removeClass('validGradient invalidGradient');
        team2box.removeClass('validGradient invalidGradient');
    }

    // select next one
    if ($(this).val() !== '') {
        $(`.matchScoreBox[tabindex="${tabindex + 1}"]`).focus();
    }

    calculateGroup(groupIndex);

    for (let i = 0; i < knockOutPhases.length; i++) {
        for (let j = 0; j < knockOutPhases[i]; (j += 2)) {
            calculateAndRedrawKnockoutMatch(knockOutPhases[i], j);
        }
    }
}

function knockoutPhaseKeyUp(){
    const thisRound = Number($(this).parent().parent().attr('round'));
    const thisRoundIndex = Number($(this).parent().parent().attr('id').replace(`ro${thisRound}nr`, ''));

    if ($(this).val() !== '') {
        $(`.knockoutMatchScoreBox[tabindex="${Number($(this).attr('tabindex')) + 1}"]`).focus();
    }

    calculateAndRedrawKnockoutMatch(thisRound, thisRoundIndex); // E.g 16, 2 for the second Ro16 match
}

/*************************
    HELPER METHODS
*************************/

function calculateAndRedrawKnockoutMatch(thisRound, thisRoundIndex) {
    const nextRound = (thisRound / 2);
    const oppsiteMatchIndex = (thisRoundIndex % 2 == 0) ? (thisRoundIndex - 1) : (thisRoundIndex + 1);
    const nextRoundIndex = (thisRoundIndex % 2 == 0) ? (thisRoundIndex / 2) : ((thisRoundIndex + 1) / 2);

    const team1 = $(`#ro${thisRound}nr${thisRoundIndex} div span`).text();
    const team2 = $(`#ro${thisRound}nr${oppsiteMatchIndex} div span`).text();

    const team1box = $(`#ro${thisRound}nr${thisRoundIndex} div input[type="text"]`);
    const team2box = $(`#ro${thisRound}nr${oppsiteMatchIndex} div input[type="text"]`);

    const team1score = team1box.val();
    const team2score = team2box.val();

    team1box.removeClass('invalidGradient validGradient');
    team2box.removeClass('invalidGradient validGradient');

    if (team1score != '' && team2score != '') {
        if (/[0-9]P?/.test(team1score) && /[0-9]P?/.test(team2score) && (team1score != team2score)) {
            $(`#ro${nextRound}nr${nextRoundIndex} div input[type="text"]`).removeAttr('disabled');
            $(`#ro${nextRound}nr${nextRoundIndex} div span`).css('color', 'black');

            let winningTeamName;

            if (team1score.includes('P')) {
                winningTeamName = team1;
            } else if (team2score.includes('P')) {
                winningTeamName = team2;
            } else {
                winningTeamName = team1score > team2score ? team1 : team2;
            }
            const winningTeam = teams.find(x => x.name === winningTeamName);

            $(`#ro${nextRound}nr${nextRoundIndex} div span`).text(winningTeamName);
            $(`#ro${nextRound}nr${nextRoundIndex} div img`).removeClass('hidden');
            $(`#ro${nextRound}nr${nextRoundIndex} div img`).attr('src', winningTeam.flag);

            team1box.addClass('validGradient');
            team2box.addClass('validGradient');
        } else {
            team1box.addClass('invalidGradient');
            team2box.addClass('invalidGradient');

            $(`#ro${nextRound}nr${nextRoundIndex} div span`).css('color', 'gainsboro');
            $(`#ro${nextRound}nr${nextRoundIndex} div span`).text('TBD');
            $(`#ro${nextRound}nr${nextRoundIndex} div img`).addClass('hidden');
            $(`#ro${nextRound}nr${nextRoundIndex} div img`).attr('src', '');
            $(`#ro${nextRound}nr${nextRoundIndex} div input[type="text"]`).val('');
            $(`#ro${nextRound}nr${nextRoundIndex} div input[type="text"]`).attr('disabled', '');
        }
    } else {
        $(`#ro${nextRound}nr${nextRoundIndex} div span`).css('color', 'gainsboro');
        $(`#ro${nextRound}nr${nextRoundIndex} div span`).text('TBD');
        $(`#ro${nextRound}nr${nextRoundIndex} div img`).addClass('hidden');
        $(`#ro${nextRound}nr${nextRoundIndex} div img`).attr('src', '');
        $(`#ro${nextRound}nr${nextRoundIndex} div input[type="text"]`).val('');
        $(`#ro${nextRound}nr${nextRoundIndex} div input[type="text"]`).attr('disabled', '');
    }

    checkIfTournamentIsDone();
}

function checkIfTournamentIsDone(){
    let tournamentIsComplete = true;
    $('.knockoutMatchScoreBox').each(function(){
        if (!isNumber(Number($(this).val())) || $(this).val() == ''){
            tournamentIsComplete = false;
        }
    });
    if (tournamentIsComplete && !idVariable){
        console.log('show');
        $('#overlay').show();
        $('#overlay').css('opacity', '0.6');
        $('#tournamentCompleteContainer').css('display', 'block');

        let winner;

        if ($('#ro2nr1 input').val() > $('#ro2nr2 input').val()) {
            winner = $('#ro2nr1 span').text();
            $('#ro2nr1 i').css('visibility', 'visible');
        } else {
            winner = $('#ro2nr2 span').text();
            $('#ro2nr2 i').css('visibility', 'visible');
        }

        const flag = teams.find(x => x.name === winner).flag;

        $('#predictedWinner').html(`<img src="${flag}" /><h1>${winner}</h1>`);

        let resultat = '';

        $('.matchScoreBox').each(function(){
            resultat += $(this).val();
        });
        $('.knockoutPhaseCell[round="16"] .knockoutMatchScoreBox').each(function(index){
            resultat += $(this).val();
        });
        $('.knockoutPhaseCell[round="8"] .knockoutMatchScoreBox').each(function(index){
            resultat += $(this).val();
        });
        $('.knockoutPhaseCell[round="4"] .knockoutMatchScoreBox').each(function(index){
            resultat += $(this).val();
        });
        $('.knockoutPhaseCell[round="2"] .knockoutMatchScoreBox').each(function(index){
            resultat += $(this).val();
        });

        const shareableLink = window.location.href.split('?')[0] + '?id=' + resultat;

        $('#codeTextArea').val(shareableLink);

        $('html,body').animate({ scrollTop: 0 }, 'slow');

        $('#facebookShareLink').unbind();
        $('#facebookShareLink').click(function() {
            window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${shareableLink}`,
            '',
            'width=200,height=100');
        });
    }
}

function arrayEquals(array1, array2) {
    return array1.length === array2.length &&
           array1.every(x => array2.includes(x)) &&
           array2.every(x => array1.includes(x));
}

function calculateThirdPlaces() {
    data.thirdPlaceGroup = {
        teams: data.groups.reduce((a, c) => {
            const copy = Object.assign({}, c.teams[2]);
            copy.fromGroup = c.name;
            a.push(copy);
            return a;
        }, [])
    }
    sortGroup(data.thirdPlaceGroup);
    
    let htmlString = '';
    for (let k = 0; k < data.thirdPlaceGroup.teams.length; k++) {
        if (k == 4) { // add line in middle
            htmlString += `<tr><td align="center" colspan="10"><div class="groupMiddleLine"></td></tr>`;
        }
        htmlString += `<tr>`;
        htmlString += `<td><p>${(k + 1)}</td>`;
        htmlString += `<td><img src="${data.thirdPlaceGroup.teams[k].flag}" class="countryFlag" alt="${data.thirdPlaceGroup.teams[k].name}"><p>${data.thirdPlaceGroup.teams[k].name}</p></td>`;
        htmlString += `<td align="center"><p>${data.thirdPlaceGroup.teams[k].mp}</p></td>`;
        htmlString += `<td align="center"><p>${data.thirdPlaceGroup.teams[k].w}</p></td>`;
        htmlString += `<td align="center"><p>${data.thirdPlaceGroup.teams[k].d}</p></td>`;
        htmlString += `<td align="center"><p>${data.thirdPlaceGroup.teams[k].l}</p></td>`;
        htmlString += `<td align="center"><p>${data.thirdPlaceGroup.teams[k].f}</p></td>`;
        htmlString += `<td align="center"><p>${data.thirdPlaceGroup.teams[k].a}</p></td>`;
        htmlString += `<td align="center"><p>${data.thirdPlaceGroup.teams[k].diff}</p></td>`;
        htmlString += `<td align="center"><p>${data.thirdPlaceGroup.teams[k].p}</p></td>`;
        htmlString += '</tr>';
    }
    $(`#thirdPlaceGroup tbody`).html(htmlString);
    console.log(data.thirdPlaceGroup)
    
    const top4teams = data.thirdPlaceGroup.teams.slice(0,4);
    const fromGroups = top4teams.reduce((a, c) => {
        a.push(c.fromGroup);
        return a;
    }, []);
    console.log(fromGroups)

    const combination = thirdPlaceCombinationMatrix.find(x => arrayEquals(fromGroups, x.thirdPlaceTeamsCombination));
    console.log('combination', combination)

    combination.thirdPlaceTeamsCombination.forEach(letter => {
        const ro16boxNumber = combination[letter];
        const team = top4teams.find(team => team.fromGroup === letter);
        if (team.p > 0) {
            $(`#ro16nr${ro16boxNumber} div span`).html(team.name);
            $(`#ro16nr${ro16boxNumber} div img`).attr('src', team.flag);
            $(`#ro16nr${ro16boxNumber} div img`).removeClass('hidden');
            $(`#ro16nr${ro16boxNumber} div span`).css('color', 'black');
            $(`#ro16nr${ro16boxNumber} div input[type="text"]`).removeAttr('disabled');
        }
    });

    let allGroupsAreValid = true;
    data.groups.forEach(group => {
        group.matches.forEach(match => {
            if (!(matchIsSet(match) && matchIsValid(match))) {
                allGroupsAreValid = false;
            }
        });
    });

    if (allGroupsAreValid) {
        $(`#thirdPlaceGroup`).addClass('validGradient');
    } else {
        $(`#thirdPlaceGroup`).removeClass('validGradient');
    }
}

function calculateGroup(groupIndex){
    for (let i = 0; i < data.groups[groupIndex].teams.length; i++) {
        data.groups[groupIndex].teams[i].a = 0;
        data.groups[groupIndex].teams[i].d = 0;
        data.groups[groupIndex].teams[i].f = 0;
        data.groups[groupIndex].teams[i].l = 0;
        data.groups[groupIndex].teams[i].mp = 0;
        data.groups[groupIndex].teams[i].p = 0;
        data.groups[groupIndex].teams[i].diff = 0;
        data.groups[groupIndex].teams[i].w = 0;
    }

    for (let i = 0; i < data.groups[groupIndex].matches.length; i++) {
        if (matchIsSet(data.groups[groupIndex].matches[i]) && matchIsValid(data.groups[groupIndex].matches[i])) { // Match is set
            const team1 = data.groups[groupIndex].matches[i].team1;
            const team2 = data.groups[groupIndex].matches[i].team2;
            const team1score = data.groups[groupIndex].matches[i].team1score;
            const team2score = data.groups[groupIndex].matches[i].team2score;

            team1.mp++;
            team1.f += Number(team1score);
            team1.a += Number(team2score);
            team1.diff = (team1.f - team1.a);

            team2.mp++;
            team2.f += Number(team2score);
            team2.a += Number(team1score);
            team2.diff = (team2.f - team2.a);

            if (team1score > team2score) {
                team1.w++;
                team2.l++;
                team1.p += 3;
            } else if (team2score > team1score) {
                team2.w++;
                team2.p += 3;
                team1.l++;
            } else if (team2score == team1score) {
                team1.d++;
                team2.d++;
                team1.p++;
                team2.p++;
            }
        }
    }
    redrawGroup(groupIndex);
    calculateThirdPlaces();
}

function redrawGroup(index){
    sortGroup(data.groups[index]);
    let htmlString = '';
    for (let k = 0; k < data.groups[index].teams.length; k++) {
        if (k == 2) { // add line in middle
            htmlString += `<tr><td align="center" colspan="10"><div class="groupMiddleLine"></td></tr>`;
        }
        htmlString += `<tr>`;
        htmlString += `<td><p>${(k + 1)}</td>`;
        htmlString += `<td><img src="${data.groups[index].teams[k].flag}" class="countryFlag" alt="${data.groups[index].teams[k].name}"><p>${data.groups[index].teams[k].name}</p></td>`;
        htmlString += `<td align="center"><p>${data.groups[index].teams[k].mp}</p></td>`;
        htmlString += `<td align="center"><p>${data.groups[index].teams[k].w}</p></td>`;
        htmlString += `<td align="center"><p>${data.groups[index].teams[k].d}</p></td>`;
        htmlString += `<td align="center"><p>${data.groups[index].teams[k].l}</p></td>`;
        htmlString += `<td align="center"><p>${data.groups[index].teams[k].f}</p></td>`;
        htmlString += `<td align="center"><p>${data.groups[index].teams[k].a}</p></td>`;
        htmlString += `<td align="center"><p>${data.groups[index].teams[k].diff}</p></td>`;
        htmlString += `<td align="center"><p>${data.groups[index].teams[k].p}</p></td>`;
        htmlString += '</tr>';
    }
    $(`#groupTableBodyIndex${index}`).html(htmlString);
    let groupIsValid = true;
    for (let k = 0; k < data.groups[index].matches.length; k++) {
        if (!(matchIsSet(data.groups[index].matches[k]) && matchIsValid(data.groups[index].matches[k]))) {
            groupIsValid = false;
        }
    }

    const ro16box1Number = knockoutPhaseNumberMatrix[`${data.groups[index].name}1`];
    const ro16box2Number = knockoutPhaseNumberMatrix[`${data.groups[index].name}2`];

    if (groupIsValid) {
        $(`.groupContainer[groupIndex="${index}"]`).addClass('validGradient');
        $(`#ro16nr${ro16box1Number} div span`).html(data.groups[Number(index)].teams[0].name);
        $(`#ro16nr${ro16box2Number} div span`).html(data.groups[Number(index)].teams[1].name);
        $(`#ro16nr${ro16box1Number} div img`).attr('src', data.groups[Number(index)].teams[0].flag);
        $(`#ro16nr${ro16box2Number} div img`).attr('src', data.groups[Number(index)].teams[1].flag);
        $(`#ro16nr${ro16box1Number} div img`).removeClass('hidden');
        $(`#ro16nr${ro16box2Number} div img`).removeClass('hidden')
        $(`#ro16nr${ro16box1Number} div span`).css('color', 'black');
        $(`#ro16nr${ro16box2Number} div span`).css('color', 'black');
        $(`#ro16nr${ro16box1Number} div input[type="text"]`).removeAttr('disabled');
        $(`#ro16nr${ro16box2Number} div input[type="text"]`).removeAttr('disabled');
    } else {
        $(`.groupContainer[groupIndex="${index}"]`).removeClass('validGradient');
        $(`#ro16nr${ro16box1Number} div span`).html('TBD');
        $(`#ro16nr${ro16box2Number} div span`).html('TBD');
        $(`#ro16nr${ro16box1Number} div span`).css('color', 'gainsboro');
        $(`#ro16nr${ro16box2Number} div span`).css('color', 'gainsboro');
        $(`#ro16nr${ro16box1Number} div img`).addClass('hidden');
        $(`#ro16nr${ro16box2Number} div img`).addClass('hidden')
        $(`#ro16nr${ro16box1Number} div input[type="text"]`).attr('disabled', '');
        $(`#ro16nr${ro16box2Number} div input[type="text"]`).attr('disabled', '');
        $(`#ro16nr${ro16box1Number} div input[type="text"]`).val('');
        $(`#ro16nr${ro16box2Number} div input[type="text"]`).val('');
    }
}

function matchIsValid(match) {
    return (isNumber(match.team1score) && isNumber(match.team2score));
}

function matchIsSet(match) {
    return (match.team1score != '' && match.team2score != '');
}

function sortGroup(group) {
    // Sorting of groups is based on UEFA:s ruleset which can be found here
    // https://documents.uefa.com/v/u/WVKcnryVkASzztwJjPBcIw
    // See article 20 (page 23)

    group.teams.sort((a, b) => {
        const currentGroup = data.groups.find(group => group.teams.some(t => t.name === a.name));
        const currentMatch = currentGroup.matches.find(match =>  (match.team1.name === a.name && match.team2.name === b.name) ||
                                                                 (match.team2.name === a.name && match.team1.name === b.name));
        if (b.p != a.p) {
            return (b.p - a.p);
        } else {
            if (b.diff != a.diff) {
                return (b.diff - a.diff);
            } else if (currentMatch && currentMatch.team1score != currentMatch.team2score) { // Inbördes möten
                if (currentMatch.team1.name === a.name && currentMatch.team2.name === b.name) {
                    return Number(currentMatch.team2score) - Number(currentMatch.team1score);
                } else if (currentMatch.team2.name === a.name && currentMatch.team1.name === b.name) {
                    return Number(currentMatch.team1score) - Number(currentMatch.team2score);
                }
            } else if (b.f != a.f) {
                return (b.f - a.f);
            } else {
                b.w - a.w;
            }
        }
    });
}

function isNumber(input) {
    return eval('/^\\d+$/').test(input);
}

function loadDataFromId(idVariable) {
    startLoader();

    setTimeout(() => {
        let i = 0;

        $('.matchScoreBox').each(function(){
            $(this).val(idVariable[i]);
            $(this).keyup();
            i++;
        });
        $('.knockoutPhaseCell[round="16"] .knockoutMatchScoreBox').each(function(index){
            $(this).val(idVariable[i]);
            $(this).keyup();
            i++;
        });
        $('.knockoutPhaseCell[round="8"] .knockoutMatchScoreBox').each(function(index){
            $(this).val(idVariable[i]);
            $(this).keyup();
            i++;
        });
        $('.knockoutPhaseCell[round="4"] .knockoutMatchScoreBox').each(function(index){
            $(this).val(idVariable[i]);
            $(this).keyup();
            i++;
        });
        $('.knockoutPhaseCell[round="2"] .knockoutMatchScoreBox').each(function(index){
            $(this).val(idVariable[i]);
            $(this).keyup();
            i++;
        });

        stopLoader();
    }, 50);
}