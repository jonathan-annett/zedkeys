
/*


// portions of this code are conceptually borrowed from https://github.com/zedapp/zed/blob/661ba3ac2eda0757fea1a4d914195cd0043a2371/app/js/editor.js

// reuse authorized here: https://github.com/zedapp/zed/blob/master/LICENSE
Copyright (C) 2013, Zef Hemel

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/
module.exports = function(window) {

    function camelHyphens(camelCased) {
        return camelCased.split('').map(function(X, ix) {

            return (ix === 0) ? X.toUpperCase() : (X >= 'A' && X <= 'Z') ? '-' + X : X;

        }).join('');
    }
    
    function zedName(fn) {
        var res = '';
        (typeof fn==='function'?fn.name:fn).split('').forEach(function(c,i,a){
            var C=c.toUpperCase();
            res += i===0?C :   c==='_' ? ':' : ( a[i-1]!=='_'&&C===c ? ' '+c : c) ; 
        });
        return res;
    }

    function keysToCommands(keys,namePrefix) {

        var result = {
            handlers: {},
            names: {},
            list: [],
            addTo: function(editor) {
                var adder = editor.addCommand ? editor.addCommand.bind(editor) : editor.commands && editor.commands.addCommand ? editor.commands.addCommand.bind(editor.commands) : undefined;
                if (adder) result.list.forEach(adder);
            },
        };


        function winMac(key) {

            var win = [],
                mac = [];
            key.split('-').forEach(function(tok) {
                if (tok === 'CmdCtrl') {
                    win.push('Ctrl');
                    mac.push('Cmd');
                } else {
                    win.push(tok);
                    mac.push(tok);
                }
            });

            return {
                win: win.join('-'),
                mac: mac.join('-')
            }
        }

        var flatten = function(keys, base) {
            base = base || '';
            Object.keys(keys).forEach(function(k) {
                if (typeof keys[k] === 'function') {
                    var handler = keys[k];
                    var name = handler.name;
                    var hyphenName = camelHyphens(namePrefix+name);
                    result.list.push({
                        name: hyphenName,
                        bindKey: winMac(base + k),
                        exec: handler
                    });
                    result.handlers[name] = handler;
                    result.names[hyphenName] = handler;
                } else {
                    flatten(keys[k], base + k + '-');
                }
            });
        };

        flatten(keys);
        return result;

    }


    function zedkeys() {


        function copy(editor, args) {
            console.log("copy");
            return false;
        }

        function cut(editor, args) {
            console.log("cut");
            return false;
        }

        function paste(editor, args) {
            console.log("paste");
            return false;
        }
        
        function fold(editor, args) {
            console.log("fold");
            return false;
        }
        
        function unfold(editor, args) {
            console.log("unfold");
            return false;
        }

        
        function foldAll(editor, args) {
            console.log("foldAll");
            return false;
        }
        
        
        function unfoldAll(editor, args) {
            console.log("unfoldAll");
            return false;
        }


        function autoIndentOnPaste(editor, session, e) {
            var pos = editor.getSelectionRange().start;
            var line = editor.getSession().getLine(pos.row);
            var tabSize = config.getPreference("tabSize", session);
            var col = pos.column;
            for (var i = 0; i < pos.column; i++) {
                if (line[i] === "\t") {
                    col += (tabSize - 1);
                }
            }
            var tabAsSpaces = "";
            for (i = 0; i < tabSize; i++) {
                tabAsSpaces += " ";
            }
            var text = e.text.replace(/\t/gm, tabAsSpaces);
            var lines = text.split("\n");
            var regexp = /\S/;
            var min = -1;
            var index;
            for (i = 1; i < lines.length; i++) {
                index = lines[i].search(regexp);
                if (index !== -1 && (index < min || min === -1)) {
                    min = index;
                }
            }
            var adjust = col - min;
            if (min > -1 && adjust !== 0) {
                if (adjust < 0) {
                    for (i = 1; i < lines.length; i++) {
                        lines[i] = lines[i].substring(-adjust);
                    }
                } else if (adjust > 0) {
                    var add = "";
                    for (i = 0; i < adjust; i++) {
                        add += " ";
                    }

                    for (i = 1; i < lines.length; i++) {
                        lines[i] = add + lines[i];
                    }
                }
            }

            lines[0] = lines[0].substring(lines[0].search(regexp));
            e.text = lines.join("\n");
            if (!config.getPreference("useSoftTabs", session)) {
                regexp = new RegExp(tabAsSpaces, "gm");
                e.text = e.text.replace(regexp, "\t");
            }
        }

        function find(session, needle, dir) {
            var Search = ace.require("ace/search").Search;
            var search = new Search();
            search.$options.wrap = true;
            search.$options.needle = needle;
            search.$options.caseSensitive = true;
            search.$options.wholeWord = true;
            search.$options.backwards = dir == -1;
            return search.find(session);
        }
        
        function selectMore(edit, dir) {
            var session = edit.getSession();
            var sel = session.multiSelect;

            var range = sel.toOrientedRange();
            var needle = session.getTextRange(range);

            var newRange = find(session, needle, dir);
            if (newRange) {
                newRange.cursor = dir == -1 ? newRange.start : newRange.end;
                edit.multiSelect.addRange(newRange);
            }
        }
        
        // taken from https://github.com/zedapp/zed/blob/661ba3ac2eda0757fea1a4d914195cd0043a2371/app/js/editor.js#L18
        var IDENT_REGEX = /[a-zA-Z0-9_$\-]+/;
        var PATH_REGEX = /[\/\.a-zA-Z0-9_$\-:]/;

        
        // taken from https://github.com/zedapp/zed/blob/661ba3ac2eda0757fea1a4d914195cd0043a2371/app/js/editor.js#L229
        function getIdentifierUnderCursor (edit, regex) {
            regex = regex || IDENT_REGEX;
            return edit.getSession().getTextRange(getIdentifierUnderCursorRange(edit, regex));
        }
        
        // taken from https://github.com/zedapp/zed/blob/661ba3ac2eda0757fea1a4d914195cd0043a2371/app/js/editor.js#L234
        function getIdentifierUnderCursorRange(edit, regex) {
            regex = regex || IDENT_REGEX;
            var Range = ace.require("ace/range").Range;
            var session = edit.getSession();
            var cursor = edit.getCursorPosition();
            var line = session.getLine(cursor.row);

            // If cursor is not on an identifier at all, return empty string
            if (!regex.test(line[cursor.column])) {
                return "";
            }

            for (var startCol = cursor.column; startCol >= 0; startCol--) {
                if (!regex.test(line[startCol])) {
                    startCol++;
                    break;
                }
            }
            for (var endCol = cursor.column; endCol < line.length; endCol++) {
                if (!regex.test(line[endCol])) {
                    break;
                }
            }
            return new Range(cursor.row, startCol, cursor.row, endCol);
        }
        
        
        // based on code from https://github.com/zedapp/zed/blob/661ba3ac2eda0757fea1a4d914195cd0043a2371/app/js/editor.js#L1033
        function find_NextInstanceOfIdentifier(edit) {
            if (edit.selection.isEmpty()) {
                var range = getIdentifierUnderCursorRange(edit);
                edit.selection.setSelectionRange(range);
            }
            edit.findNext({
                caseSensitive: true,
                wholeWord: true
            });
        }
        find_NextInstanceOfIdentifier.doc = "Jump to the next occurence of the word currently under the cursor.";


        // based on code from https://github.com/zedapp/zed/blob/661ba3ac2eda0757fea1a4d914195cd0043a2371/app/js/editor.js#L1048
        function find_PreviousInstanceOfIdentifier(edit) {
            if (edit.selection.isEmpty()) {
                var range = getIdentifierUnderCursorRange(edit);
                edit.selection.setSelectionRange(range);
            }
            edit.findPrevious({
                caseSensitive: true,
                wholeWord: true
            });
        }
        find_PreviousInstanceOfIdentifier.doc= "Jump to the previous occurence of the word currently under the cursor.";
        
      
        // based on code from https://github.com/zedapp/zed/blob/661ba3ac2eda0757fea1a4d914195cd0043a2371/app/js/editor.js#L660
        function cursor_Multiple_AddAtNextInstanceOfIdentifier(edit) {
            if (edit.selection.isEmpty()) {
                var range = getIdentifierUnderCursorRange(edit);
                edit.selection.setSelectionRange(range);
            }
            selectMore(edit, 1);
        }
        cursor_Multiple_AddAtNextInstanceOfIdentifier.doc="Add an additional cursor where the current word next appears in the current file.";

        //based on code from https://github.com/zedapp/zed/blob/661ba3ac2eda0757fea1a4d914195cd0043a2371/app/js/editor.js#L671
        function cursor_Multiple_AddAtPreviousInstanceOfIdentifier(edit) {
            if (edit.selection.isEmpty()) {
                var range = getIdentifierUnderCursorRange(edit);
                edit.selection.setSelectionRange(range);
            }
            selectMore(edit, -1);
        }
        cursor_Multiple_AddAtPreviousInstanceOfIdentifier.doc = "Add an additional cursor where the current word previously appears in the current file.";


        //based on code from https://github.com/zedapp/zed/blob/661ba3ac2eda0757fea1a4d914195cd0043a2371/app/js/editor.js#L682
        function cursor_Multiple_AddAbove (editor) {
            editor.selectMoreLines(-1);
        }
        cursor_Multiple_AddAbove.doc="Add an additional cursor one row above the current cursor.";

        //based on code from https://github.com/zedapp/zed/blob/661ba3ac2eda0757fea1a4d914195cd0043a2371/app/js/editor.js#L689
        function cursor_Multiple_AddBelow (editor) {
            editor.selectMoreLines(1);
        }
        cursor_Multiple_AddBelow.doc= "Add an additional cursor one row below the current cursor.";



        var keys = {

            CmdCtrl: {

                "C": copy,
                "X": cut,
                "V": paste

            },

            Ctrl: {

                "[": find_PreviousInstanceOfIdentifier,
                "]": find_NextInstanceOfIdentifier,

                Shift: {

                    "[": cursor_Multiple_AddAtPreviousInstanceOfIdentifier,
                    "]": cursor_Multiple_AddAtNextInstanceOfIdentifier,
                    Up: cursor_Multiple_AddAbove,
                    Down: cursor_Multiple_AddBelow,
                }

            }

        };

        return keysToCommands(keys,'Zed-');

    }
    
    if (typeof window==='object') window.zedkeys=zedkeys;
};