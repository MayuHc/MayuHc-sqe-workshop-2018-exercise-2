import $ from 'jquery';
import {parseCode, substituteAndColor} from './code-analyzer';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let parsedCode = parseCode(codeToParse);
        $('#parsedCode').val(JSON.stringify(parsedCode, null, 2));
        let args = $('#inputPlaceholder').val();
        let codeAfterSymSub = substituteAndColor(codeToParse, args);
        document.getElementById('result').innerHTML = createHtml(codeAfterSymSub);
    });
});

function createHtml(lines){
    return lines.reduce(
        (acc, curr) => {
            return acc.concat(curr) + '<br>';
        }
        , []);
}
