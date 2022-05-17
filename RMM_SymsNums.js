var RMM_SymsNums = (function() {
        var xpos = {
            'asm' : { 
                'triple' : {0:[19, 47, 82], 
                            1:[154, 182, 217], 
                            2:[288, 316, 351], 
                            3:[422, 450, 485]},
                'double' : {0:[ 23,  68], 
                            1:[158, 203], 
                            2:[295, 338], 
                            3:[428, 473]},
                'single' : {0:[48], 
                            1:[183], 
                            2:[318], 
                            3:[453]}
                },
            'm2' : { 
                'triple' : {0:[9, 27, 45], 
                            1:[85, 103, 121], 
                            2:[161, 178, 197], 
                            3:[235, 253, 271]},
                'double' : {0:[ 8,  36], 
                            1:[83, 111], 
                            2:[158, 186], 
                            3:[233, 262]},
                'single' : {0:[23], 
                            1:[98], 
                            2:[173], 
                            3:[248]}
                },
            'chart_xright' : {0:520,
                              1:528,
                              2:536}
            }
        var syms = {
            's' : '<path d="M1.484 28.23l4.35-.65c.25 1.7.9 3.05 2 4 1.15.9 2.7 1.35 4.7 1.35s3.5-.4 4.5-1.2c.95-.85 1.45-1.8 1.45-2.9 0-1-.45-1.8-1.3-2.35-.6-.4-2.1-.9-4.5-1.5-3.2-.8-5.45-1.5-6.7-2.1-1.25-.6-2.15-1.4-2.8-2.45-.65-1.05-1-2.2-1-3.5 0-1.15.3-2.2.8-3.2.55-1 1.25-1.8 2.15-2.45.7-.5 1.65-.95 2.8-1.3 1.2-.35 2.45-.5 3.8-.5 2.05 0 3.85.3 5.4.85 1.5.6 2.65 1.4 3.4 2.4.7 1 1.2 2.35 1.5 4l-4.3.6c-.2-1.35-.75-2.4-1.7-3.15s-2.25-1.1-3.95-1.1c-2.05 0-3.45.35-4.35 1-.85.65-1.3 1.45-1.3 2.35 0 .55.2 1.1.55 1.55.35.45.95.85 1.7 1.15.45.15 1.7.55 3.85 1.15 3.15.8 5.3 1.5 6.55 2 1.2.55 2.15 1.3 2.85 2.3.7 1.05 1.05 2.3 1.05 3.8 0 1.45-.4 2.85-1.25 4.1-.85 1.3-2.1 2.3-3.7 3-1.6.75-3.45 1.1-5.5 1.1-3.35 0-5.9-.7-7.7-2.1-1.75-1.4-2.85-3.5-3.35-6.25z" fill-rule="nonzero"/>',
            'line_total' : '<path d="M-.048 149.79H448.00v8.0H-.048z"/>',
            'plus' : '<path d="M40.092 372.586V347.4H14.769v-17.334h25.323v-25.323h16.927v25.323h25.458V347.4H57.02v25.187H40.092z" fill-rule="nonzero"/>',
            'minus' : '<path fill-rule="nonzero" d="M16.665 342.118h55.0v18.552H16.665z"/>',
            'minus_print' : '<path fill-rule="nonzero" d="M16.665 342.118h55.0v18.552H16.665z"/>',
            'multiply' : '<path d="M9.894 386.534l25.323-36.156-24.24-34.125h22.615l12.458 19.365 13.136-19.365h21.802l-23.834 33.312 26 36.97H60.27L46.05 364.731l-14.354 21.802H9.894z" fill-rule="nonzero"/>',
            'slash' : '<path d="M60.391 14.42l-44.16 76.22 10.2-.152 44.161-76.22-10.2.152z"/>',
            'check' : '<path d="M35.049 6.46h6.95c-3.5 2.6-8.75 8.15-12.9 13-7.15 8.4-13.1 17.4-13.1 17.4-1.5 1.05-3.8.25-4.3.75-.25-.75-4.45-7.15-5.25-8.25-.85-1.05-4-5.35-5.05-5.7 1.75-1.85 7.6-3.95 9.05-3.95 1.25 0 1.1 3 2.6 6.4l.8 3c2.75-4.65 6.25-9.15 10.55-13.55 4.35-4.4 6.55-6.75 10.65-9.1z" fill-rule="nonzero"/>',
            'decimal' : '<circle cx="210" cy="2.5" r="2.5" transform="matrix(1.0 0 0 1.0 0 0)"/>',
            'divide_print' : '<path d="M162.912,75.795L162.912,10.789L384.739,10.789" style="fill:none;stroke:black;stroke-width:6.0px;" transform="matrix(.3 0 0 .3 0 0)"/>',
            'decimal_print' : '<circle cx="210" cy="3.0" r="3.0" transform="matrix(0.5 0 0 0.5 0 0)"/>',
        };
        var operator_xy = {
            'asm_plus' : {'x' : 0, 'y' : -60},
            'asm_minus' : {'x' : 0, 'y' : -105},
            'asm_multiply' : {'x' : 8, 'y' : -35},
            'asm_verdict_0_multiply' : {'x' : 58, 'y' : 490},
            'asm_verdict_1_multiply' : {'x' : 194, 'y' : 490},
            'asm_verdict_2_multiply' : {'x' : 328, 'y' : 490},
            'asm_verdict_3_multiply' : {'x' : 464, 'y' : 490},
            'asm_verdict_0_check' : {'x' : 55, 'y' : 565},
            'asm_verdict_1_check' : {'x' : 191, 'y' : 565},
            'asm_verdict_2_check' : {'x' : 325, 'y' : 565},
            'asm_verdict_3_check' : {'x' : 464, 'y' : 565},
            'm2_plus' : {'x' : 0, 'y' : -60},
            'm2_minus' : {'x' : 0, 'y' : -105},
            'm2_multiply' : {'x' : 8, 'y' : -35},
            'm2_verdict_0_multiply' : {'x' : 25, 'y' : -40},
            'm2_verdict_1_multiply' : {'x' : 100, 'y' : -40},
            'm2_verdict_2_multiply' : {'x' : 175, 'y' : -40},
            'm2_verdict_3_multiply' : {'x' : 250, 'y' : -40},
            'm2_verdict_0_check' : {'x' : 25, 'y' : 46},
            'm2_verdict_1_check' : {'x' : 100, 'y' : 46},
            'm2_verdict_2_check' : {'x' : 175, 'y' : 46},
            'm2_verdict_3_check' : {'x' : 250, 'y' : 46}
        }
        var transforms = {
            'plus' : 'transform="matrix(.9 0 0 .9 1 1)"',
            'linem2' : 'transform="matrix(1.1 0 0 1.0 0 0)"',
            'multiply' : 'transform="matrix(.8 0 0 .8 0 0)"',
            'borrow_carry_minus' : 'transform="matrix(.4 0 0 .4 0 -115)"',
            'borrow_carry_number' : 'transform="matrix(.45 0 0 .45 0 0)"',
            'borrow_carry_slash' : ' fill="#b30000" transform="matrix(.65 0 0 .65 0 0)"',
            'borrow_carry_slash_num' : ' fill="#e64d00" transform="matrix(1.4 0 0 1.4 0 0)"',
            'placeholder_num' : 'transform="matrix(.2 0 0 .2 0 0)"',
            'placeholder_s' : 'transform="matrix(.5 0 0 .5 0 0)"',
            'm2_answer_digit' : 'transform="matrix(.4 0 0 .4 0 2)"', //one or two digit answer values
            'm2_answer_digit_triple' : 'transform="matrix(.25 0 0 .40 0 2)"', //skinny triple digits (x-scale is .5 not .65)
            'asm_answer_digit' : 'transform="matrix(.65 0 0 .65 0 0)"', //one or two digit answer values
            'asm_answer_digit_triple' : 'transform="matrix(.5 0 0 .65 0 0)"', //skinny triple digits (x-scale is .5 not .65)
            'asm_answer_neg_sign' : 'transform="matrix(.6 0 0 .6 0 0)"',
            'asm_verdict_multiply' : 'fill="red" transform="matrix(.3 0 0 .3 0 0)"',
            'asm_verdict_check' : 'fill="#00e600" transform="matrix(1.1 0 0 1.1 0 0)"',
            'm2_verdict_multiply' : 'fill="red" transform="matrix(.3 0 0 .3 0 0)"',
            'm2_verdict_check' : 'fill="#00e600" transform="matrix(0.8 0 0 0.8 0 0)"',
            'd3_number' : 'transform="matrix(0.35 0 0 0.35 0 0)"',
            'print' : ' transform="matrix(.15 0 0 .15 0 0)"',
            'printd3' : ' transform="matrix(.14 0 0 .14 0 0)"',
            'print_minus' : ' transform="matrix(.15 0 0 .15 0 -45)"',
            'chart_yaxis_label' : ' transform="matrix(.15 0 0 .15 0 0)"',
            'chart_xaxis_label' : ' transform="matrix(.1 0 0 .1 0 0)"'
        }
        var nums = {
            0 : '<path d="M5.566 49.945c0-11.51 1.083-20.72 3.52-27.625C11.39 15.278 14.91 9.86 19.515 6.07 24.254 2.278 30.076.382 37.118.382c5.146 0 9.75 1.083 13.677 3.115 3.927 2.166 7.177 5.146 9.75 9.073 2.573 3.927 4.469 8.802 5.958 14.49 1.49 5.687 2.167 13.27 2.167 22.885 0 11.375-1.083 20.583-3.52 27.49-2.303 7.041-5.824 12.458-10.428 16.25-4.604 3.791-10.562 5.687-17.604 5.687-9.344 0-16.656-3.386-22.073-10.021-6.365-8.125-9.48-21.26-9.48-39.406zm12.187 0c0 15.843 1.896 26.541 5.552 31.823 3.792 5.146 8.396 7.854 13.813 7.854s10.02-2.708 13.812-7.99c3.657-5.281 5.552-15.844 5.552-31.687 0-15.98-1.895-26.542-5.552-31.823-3.791-5.282-8.395-7.854-13.948-7.854-5.416 0-9.885 2.302-13.135 6.906-4.063 5.958-6.094 16.791-6.094 32.77z" fill-rule="nonzero"/>',
            1 : '<path d="M50.389 97.747H38.472V21.913c-2.844 2.709-6.635 5.417-11.375 8.125-4.604 2.844-8.802 4.875-12.458 6.23v-11.51c6.635-3.115 12.458-6.907 17.468-11.376 5.01-4.469 8.532-8.802 10.563-13h7.719v97.365z" fill-rule="nonzero"/>',
            2 : '<path d="M67.993 86.372v11.375H3.94c0-2.844.406-5.688 1.49-8.26 1.624-4.334 4.197-8.667 7.718-12.865 3.656-4.334 8.802-9.209 15.573-14.76 10.563-8.532 17.74-15.438 21.396-20.449 3.656-5.145 5.552-9.885 5.552-14.354 0-4.74-1.625-8.666-5.01-11.916-3.386-3.25-7.855-4.875-13.271-4.875-5.688 0-10.292 1.76-13.677 5.145-3.521 3.386-5.146 8.26-5.282 14.355L6.243 28.413c.812-9.073 3.927-15.979 9.479-20.854C21.139 2.82 28.452.382 37.66.382c9.343 0 16.656 2.573 22.073 7.719 5.416 5.146 8.125 11.646 8.125 19.229 0 3.927-.678 7.719-2.303 11.375-1.625 3.792-4.197 7.719-7.854 11.917-3.791 4.062-9.885 9.75-18.416 17.062-7.178 5.959-11.782 10.021-13.813 12.188a41.908 41.908 0 00-5.01 6.5h47.53z" fill-rule="nonzero"/>',
            3 : '<path d="M5.566 72.153l11.916-1.625c1.355 6.77 3.657 11.646 6.907 14.625 3.385 2.98 7.312 4.469 12.052 4.469 5.552 0 10.291-1.896 14.219-5.823 3.791-3.927 5.687-8.667 5.687-14.354 0-5.552-1.76-10.021-5.281-13.542-3.521-3.656-8.125-5.417-13.677-5.417-2.167 0-5.01.542-8.396 1.355l1.354-10.428c.813.136 1.49.136 1.896.136 5.146 0 9.614-1.354 13.677-3.927 4.062-2.709 6.094-6.771 6.094-12.323 0-4.334-1.49-7.99-4.334-10.834-2.979-2.843-6.77-4.197-11.51-4.197-4.604 0-8.531 1.354-11.51 4.333-3.115 2.844-5.146 7.177-5.959 13L6.784 25.57c1.49-7.99 4.74-14.22 9.886-18.553C21.816 2.55 28.18.382 35.9.382c5.28 0 10.155 1.219 14.624 3.385 4.469 2.303 7.854 5.417 10.156 9.344 2.438 3.927 3.657 8.125 3.657 12.459 0 4.198-1.22 7.99-3.386 11.51-2.302 3.385-5.552 6.094-10.02 8.125 5.687 1.354 10.156 4.063 13.406 8.26 3.114 4.198 4.74 9.344 4.74 15.709 0 8.396-3.115 15.573-9.344 21.531-6.094 5.823-13.948 8.802-23.292 8.802-8.531 0-15.573-2.573-21.26-7.583-5.553-5.146-8.803-11.646-9.615-19.77z" fill-rule="nonzero"/>',
            4 : '<path d="M43.618 97.747V74.59H1.638V63.62L45.786.789h9.75v62.834H68.67V74.59H55.535v23.156H43.618zm0-34.125v-43.74l-30.334 43.74h30.334z" fill-rule="nonzero"/>',
            5 : '<path d="M5.566 72.288l12.458-.947c.948 6.093 2.98 10.562 6.365 13.677 3.385 3.114 7.448 4.604 12.187 4.604 5.823 0 10.698-2.167 14.625-6.5 3.927-4.333 5.959-10.021 5.959-17.198 0-6.771-1.896-12.188-5.688-16.115-3.927-3.791-8.802-5.823-15.031-5.823-3.792 0-7.313.813-10.427 2.573-2.98 1.76-5.417 4.063-7.177 6.771l-11.24-1.354 9.344-49.834h48.208v11.376H26.555l-5.28 26c5.822-4.063 11.916-6.094 18.28-6.094 8.532 0 15.709 2.979 21.532 8.802 5.823 5.958 8.666 13.406 8.666 22.615 0 8.802-2.573 16.385-7.718 22.75-6.094 7.854-14.625 11.78-25.459 11.78-8.802 0-15.979-2.437-21.531-7.312-5.552-5.01-8.802-11.51-9.48-19.77z" fill-rule="nonzero"/>',
            6 : '<path d="M67.316 24.486l-11.917.948c-1.083-4.604-2.573-7.99-4.469-10.156-3.25-3.385-7.177-5.01-11.916-5.01-3.792 0-7.177.947-10.021 3.114-3.656 2.708-6.636 6.77-8.802 11.917-2.167 5.281-3.25 12.729-3.386 22.479 2.844-4.333 6.365-7.583 10.563-9.75 4.062-2.167 8.396-3.115 13-3.115 7.854 0 14.625 2.844 20.177 8.667 5.688 5.823 8.396 13.406 8.396 22.75 0 5.958-1.219 11.646-3.927 16.927-2.573 5.146-6.23 9.209-10.834 11.917-4.468 2.844-9.75 4.198-15.573 4.198-9.885 0-18.01-3.656-24.24-10.969-6.228-7.177-9.343-19.23-9.343-36.02 0-18.688 3.385-32.365 10.292-40.897C21.409 4.174 29.535.382 39.69.382c7.719 0 13.948 2.167 18.823 6.5 4.875 4.198 7.719 10.156 8.802 17.604zM18.7 66.33c0 4.063.813 7.99 2.573 11.781 1.76 3.792 4.198 6.636 7.313 8.532 3.114 2.03 6.364 2.979 9.885 2.979 5.01 0 9.344-2.031 12.865-6.094 3.656-4.062 5.416-9.615 5.416-16.52 0-6.772-1.76-12.053-5.28-15.845-3.657-3.791-8.126-5.822-13.543-5.822-5.28 0-9.885 2.03-13.677 5.822-3.656 3.792-5.552 8.938-5.552 15.167z" fill-rule="nonzero"/>',
            7 : '<path d="M6.243 13.518V2.008h62.833v9.343c-6.229 6.5-12.323 15.302-18.416 26.135-6.094 10.97-10.698 22.073-14.084 33.584-2.302 8.125-3.791 17.062-4.469 26.677H19.784c.136-7.583 1.76-16.792 4.605-27.625 2.843-10.834 6.906-21.26 12.323-31.282 5.28-10.02 10.968-18.416 17.062-25.322H6.243z" fill-rule="nonzero"/>',
            8 : '<path d="M23.847 45.205c-5.01-1.896-8.667-4.469-10.969-7.719-2.437-3.385-3.656-7.448-3.656-12.052 0-7.041 2.573-13 7.583-17.875C21.951 2.82 28.722.382 37.118.382c8.396 0 15.302 2.438 20.448 7.448 5.146 4.875 7.719 10.833 7.719 17.875 0 4.469-1.22 8.396-3.521 11.781-2.438 3.386-5.959 5.823-10.834 7.72 5.959 1.895 10.563 5.01 13.678 9.343 3.114 4.333 4.604 9.48 4.604 15.437 0 8.396-2.844 15.303-8.802 20.99-5.823 5.552-13.542 8.396-23.157 8.396-9.479 0-17.198-2.844-23.156-8.531C8.274 85.289 5.43 78.11 5.43 69.716c0-6.365 1.49-11.646 4.74-15.844 3.25-4.198 7.719-7.177 13.677-8.667zm-2.438-20.177c0 4.604 1.49 8.26 4.47 11.24 2.978 2.843 6.77 4.333 11.51 4.333 4.604 0 8.26-1.49 11.24-4.333 2.978-2.844 4.468-6.365 4.468-10.563 0-4.333-1.625-8.125-4.604-11.104-2.98-2.844-6.771-4.333-11.24-4.333-4.604 0-8.26 1.354-11.375 4.333-2.979 2.844-4.469 6.364-4.469 10.427zm-3.791 44.688c0 3.52.812 6.77 2.437 9.885 1.625 3.25 3.927 5.688 7.177 7.448 3.115 1.76 6.5 2.573 10.157 2.573 5.687 0 10.427-1.896 14.083-5.552 3.792-3.656 5.552-8.26 5.552-13.948 0-5.688-1.896-10.427-5.687-14.219-3.792-3.656-8.532-5.552-14.355-5.552-5.552 0-10.156 1.896-13.812 5.552-3.792 3.656-5.552 8.26-5.552 13.813z" fill-rule="nonzero"/>',
            9 : '<path d="M7.326 75.268l11.375-.948c.948 5.281 2.844 9.208 5.552 11.646 2.709 2.437 6.23 3.656 10.563 3.656 3.656 0 6.906-.813 9.614-2.573 2.709-1.625 5.01-3.927 6.771-6.635 1.76-2.844 3.25-6.636 4.469-11.376 1.083-4.74 1.76-9.614 1.76-14.49 0-.54 0-1.353-.135-2.437-2.302 3.792-5.552 6.907-9.75 9.209-4.063 2.437-8.531 3.52-13.406 3.52-7.99 0-14.76-2.843-20.313-8.666-5.552-5.823-8.26-13.542-8.26-23.021 0-9.885 2.843-17.74 8.666-23.698 5.823-6.094 13-9.073 21.803-9.073 6.229 0 12.052 1.76 17.197 5.146 5.282 3.385 9.209 8.26 11.917 14.49 2.709 6.229 4.063 15.437 4.063 27.218 0 12.459-1.354 22.344-4.063 29.657-2.573 7.312-6.635 12.864-11.917 16.791-5.28 3.792-11.51 5.688-18.687 5.688-7.583 0-13.813-2.031-18.552-6.23-4.875-4.333-7.719-10.156-8.667-17.874zm48.75-42.657c0-6.906-1.896-12.323-5.552-16.385-3.656-3.927-7.99-5.958-13.135-5.958-5.282 0-9.886 2.166-13.813 6.5-3.927 4.333-5.823 9.885-5.823 16.791 0 6.094 1.896 11.104 5.552 15.032 3.792 3.791 8.396 5.822 13.813 5.822 5.552 0 10.02-2.03 13.542-5.822 3.52-3.928 5.416-9.209 5.416-15.98z" fill-rule="nonzero"/>'
        }
        function getSyms(id) {
            return syms[id];
        }
        function getNums(id) {
            return nums[Math.abs(id)];
        }
        function getTransforms(id) {
            return transforms[id];
        }
        function getOperatorXY(id) {
            return operator_xy[id];
        }
        function getXpos(type) {
            return xpos[type];
        }
    return {
        getSyms : getSyms,
        getNums : getNums,
        getTransforms : getTransforms,
        getOperatorXY : getOperatorXY,
        getXpos : getXpos
    };
})();