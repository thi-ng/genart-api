-   API pre-initializes via <script> tag
-   PP(platform provider) registers with API

-   ART registers its params with API:
    -   Param types:
        -   choice: options, default choice
        -   color: default
        -   ramp: stops, mode
        -   range: min, max, step, default
        -   text: default, min/max len, multiline, match
        -   toggle: default
        -   weighted: options & weights, default choice
        -   xy: default
    -   API passes params specs to PP
    -   PP parses any param customizations in platform-specific manner
        -   augments existing param specs w/ overrides (e.g. edited ramp stops)
    -   API returns typechecked param getter fn to ART
-   ART initializes
-   ART sets update function in API
-   ART calls API.start()
-   ART requests specific param for current time

...

-   USER edits param in platform GUI
-   GUI notifies PP of param change
    -   platform specific mechanism, e.g. postMessage
-   PP calls API.updateParam(id)
-   API checks update mode of param
    -   API potentially triggers page/iframe reload
    -   API alternatively postMessage() to notify ART (or other scripts) of param change
