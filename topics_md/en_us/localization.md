<p><span style="font-size:75%;">Note: all video links open a new window.</span></p>

<p>RMM has been designed to support translation into other languages (localization). The translation is not hard for someone who has a good understanding of HTML, Javascript, and CSS.</p>

<p>RMM uses the <a target="_blank" href="https://docs.microsoft.com/en-us/openspecs/office_standards/ms-oe376/6c085406-a698-4e12-9d4d-c3b0ee3dbc4a">LCID Standard</a> for denoting files with language specific features (there are just five). Unlike the standard, RMM uses all lower case, and replaces the hyphen with an underscore.</p>

The four files that are language specific are described below. You can find all the files for RMM at its <a target="_blank" href="https://github.com/needMoreCoffeeNow/RightMindMath">Github Public Open Source Page</a>.</p>

<p>Language Specific App Files (en_us coded):
<ol>
<li>rightmindmath_en_us.html</li>
<li>manifest_en_us.json</li>
<li>serviceworker_en_us.js</li>
<li>RMM_CFG_en_us.js</li>
<li>RMM_styles_en_us.css</li>
</ol>
</p>

<p><b>rightmindmath_en_us.html</b>: needs to be have specific references to the manifest, service worker, CFG, and styles files. It is located in the ./app directory.</p>

<p><b>manifest_en_us.json</b>: needs to be have specific references to the app main page url (rightmindmath_en_us.html). It is located in the ./app directory.</p>

<p><b>serviceworker_en_us.js</b>: needs to be have specific references to a cache name with the language encoding, and the language specific styles and CFG files. It is located in the ./app directory.</p>

<p><b>RMM_CFG_en_us.js</b>: This is the main localization file. All the text strings used in RMM are stored here. Please reference the <a target="_blank" href="https://github.com/needMoreCoffeeNow/RightMindMath/blob/main/localization.md">Localization Notes</a> markup file for more information about changing this file. It is located in the .app/cfg directory.</p>

<p><b>RMM_styles_en_us.css</b>: This is a pretty standard and simple css file with all the styles used by RMM. Different languages will obviously require different text styles, etc. It is located in the .app/css directory.</p>
