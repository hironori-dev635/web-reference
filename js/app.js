document.addEventListener("alpine:init", () => {
  Alpine.data("referenceApp", () => ({
    sidebarOpen: false,
    currentId: null,
    html: "",
    loading: false,
    error: "",
    cache: {},
    openCategoryIds: [],

    categories: [
      {
        id: "operators",
        label: "演算子",
        icon: "fa-solid fa-plus-minus",
        items: [
          {
            id: "php-js-ternary",
            title: "三項演算子",
            blurb: "条件 ? 真のとき : 偽のとき",
          },
          {
            id: "php-js-nullish",
            title: "null合体演算子",
            blurb: "a ?? b  （無いときだけ右側）",
          },
        ],
      },
      {
        id: "json",
        label: "JSON",
        icon: "fa-solid fa-code",
        items: [
          {
            id: "json-basics",
            title: "JSONの基本と扱い方",
            blurb: "構文、型、変換、APIデータの読み書き",
          },
        ],
      },
      {
        id: "functions",
        label: "関数",
        icon: "fa-solid fa-code",
        items: [
          {
            id: "php-js-function-def",
            title: "関数定義・引数・戻り値",
            blurb: "基本定義からアロー、TypeScript比較まで",
          },
          {
            id: "php-js-arrays-objects",
            title: "PHPとJSの配列・オブジェクト",
            blurb: "配列、連想配列、オブジェクトの基本と操作",
          },
          {
            id: "php-js-functions",
            title: "PHPとJSのよく使う関数一覧",
            blurb: "文字列・数値・日付などの定番対応表",
          },
        ],
      },
      {
        id: "laravel",
        label: "Laravel",
        icon: "fa-brands fa-laravel",
        items: [
          {
            id: "laravel-sql",
            title: "LaravelのSQL関係のメソッドまとめ",
            blurb: "Query Builder / Eloquent の定番",
          },
          {
            id: "laravel-enum",
            title: "Laravelのenumの使い方",
            blurb: "PHP Enum と Eloquent / バリデーション",
          },
        ],
      },
      {
        id: "vue",
        label: "Vue",
        icon: "fa-brands fa-vuejs",
        items: [
          {
            id: "vue-props",
            title: "Vueのコンポーネントへの値受け渡し",
            blurb: "props / emit / slot / provide",
          },
          {
            id: "vue-v-model",
            title: "Vueのv-modelについて",
            blurb: "双方向バインドと defineModel",
          },
        ],
      },
    ],

    get current() {
      for (const category of this.categories) {
        const item = category.items.find(
          (entry) => entry.id === this.currentId,
        );
        if (item) {
          return { ...item, category };
        }
      }
      return null;
    },

    init() {
      this.applyHash();
      window.addEventListener("hashchange", () => this.applyHash());
      this.$watch("html", () =>
        this.$nextTick(() => {
          this.colorCodeBlocks();
          this.decorateRefLinks();
        }),
      );
      this.$el.addEventListener("click", (event) => this.jumpInPage(event));
    },

    isCategoryOpen(id) {
      return this.openCategoryIds.includes(id);
    },

    toggleCategory(id) {
      const index = this.openCategoryIds.indexOf(id);
      if (index >= 0) {
        this.openCategoryIds.splice(index, 1);
      } else {
        this.openCategoryIds.push(id);
      }
    },

    openCategory(id) {
      if (!this.openCategoryIds.includes(id)) {
        this.openCategoryIds.push(id);
      }
    },

    jumpInPage(event) {
      const link = event.target.closest(".cheat-sheet a[data-jump]");
      if (!link) {
        return;
      }
      event.preventDefault();
      const target = this.$el.querySelector(
        "#" + CSS.escape(link.dataset.jump),
      );
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    },

    colorCodeBlocks() {
      const aliases = {
        js: "js",
        javascript: "js",
        php: "php",
        vue: "vue",
        blade: "blade",
        laravel: "blade",
        json: "json",
      };

      const hljsLang = {
        js: "javascript",
        php: "php",
        vue: "xml",
        blade: "xml",
        json: "json",
      };

      this.$el.querySelectorAll(".cheat-sheet .code-block").forEach((block) => {
        const label = block
          .querySelector(".code-lang")
          ?.textContent.trim()
          .toLowerCase();
        const lang = aliases[label];
        if (lang) {
          block.dataset.lang = lang;
        }

        const code = block.querySelector("pre code");
        if (!code || typeof hljs === "undefined") {
          return;
        }

        const language = hljsLang[lang];
        if (!language) {
          return;
        }

        code.className = `language-${language}`;
        delete code.dataset.highlighted;
        hljs.highlightElement(code);
      });
    },

    decorateRefLinks() {
      this.$el.querySelectorAll(".cheat-sheet table td").forEach((td) => {
        const links = [
          ...td.querySelectorAll(
            'a[href*="php.net"], a[href*="developer.mozilla.org"]',
          ),
        ];
        if (links.length === 0 || td.querySelector(".ref-links")) {
          return;
        }
        const wrap = document.createElement("span");
        wrap.className = "ref-links";
        links.forEach((link) => {
          if (!link.querySelector(".ref-label")) {
            const label = document.createElement("span");
            label.className = "ref-label";
            label.textContent = link.textContent.trim();
            const caret = document.createElement("span");
            caret.className = "ref-caret";
            caret.setAttribute("aria-hidden", "true");
            caret.textContent = ">";
            link.replaceChildren(label, caret);
          }
          wrap.appendChild(link);
        });
        td.replaceChildren(wrap);
      });
    },

    applyHash() {
      const id = decodeURIComponent(location.hash.replace(/^#/, ""));
      this.load(id || null);
    },

    goHome() {
      this.sidebarOpen = false;
      if (location.hash) {
        history.pushState(null, "", location.pathname + location.search);
      }
      this.load(null);
    },

    closeSidebar() {
      this.sidebarOpen = false;
    },

    async load(id) {
      this.currentId = id;
      this.error = "";

      if (!id) {
        this.html = "";
        this.loading = false;
        return;
      }

      if (!this.current) {
        this.html = "";
        this.error = "指定されたページが見つかりません。";
        return;
      }

      this.openCategory(this.current.category.id);

      if (this.cache[id]) {
        this.html = this.cache[id];
        this.loading = false;
        return;
      }

      this.loading = true;
      this.html = "";

      try {
        const response = await fetch(`pages/${id}.html`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const markup = await response.text();
        this.cache[id] = markup;
        this.html = markup;
      } catch (error) {
        this.error =
          "チートシートを読み込めませんでした。ローカルで見るときは簡易サーバー経由にしてください。";
      } finally {
        this.loading = false;
      }
    },
  }));
});
