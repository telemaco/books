const Lang = imports.lang;

const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const workModel = imports.workModel;

const MainWindow = new Lang.Class({
    Name: 'MainWindow',
    Extends: Gtk.ApplicationWindow,

    _init: function(app) {
        this.parent({ application: app,
                      hide_titlebar_when_maximized: true,
                      title: "Books" });

        this._box = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL,
                                  visible: true });

        this._populate_toolbar();
        this._box.add(this._toolbar);

        this._populate_treeview();
        this._box.add(this._scroll);

        this.add(this._box);

        this._bookWindowAction = 'none';

        this._bookshelf = {};
    },

    _populate_toolbar: function() {
        this._toolbar = new Gtk.Toolbar();
        this._toolbar.get_style_context().add_class(Gtk.STYLE_CLASS_MENUBAR);

        let separator = new Gtk.SeparatorToolItem({ draw: false });
        this._toolbar.add(separator);
        separator.set_expand(true);

        let newAction = new Gio.SimpleAction({ "name": 'new' });
        newAction.connect('activate', Lang.bind(this,
                                                function() {
                                                    this._new_book();
                                                    }));
        this.application.add_action(newAction);

        this._newButton = new Gtk.ToolButton.new_from_stock(Gtk.STOCK_NEW);
        this._newButton.is_important = true;
        this._toolbar.add(this._newButton);
        this._newButton.action_name = "app.new";
    },

    _populate_treeview: function() {
        this._listStore = Gtk.ListStore.new ([ GObject.TYPE_STRING,
                                               GObject.TYPE_STRING ]);
        this._treeView = new Gtk.TreeView ({ expand: true,
                                             model: this._listStore });

        let titleCol = new Gtk.TreeViewColumn ({ title: "Title" });
        let authorCol = new Gtk.TreeViewColumn ({ title: "Author" });

        let normalCell = new Gtk.CellRendererText ();

        titleCol.pack_start(normalCell, true);
        authorCol.pack_start(normalCell, true);

        titleCol.add_attribute(normalCell, "text", 0);
        authorCol.add_attribute(normalCell, "text", 1);

        this._treeView.insert_column(titleCol, 0);
        this._treeView.insert_column(authorCol, 1);

        this._scroll = new Gtk.ScrolledWindow ({ hscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
                                                 vscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
                                                 shadow_type: Gtk.ShadowType.ETCHED_IN,
                                                 height_request: 180,
                                                 width_request: 400 });

        this._scroll.add_with_viewport(this._treeView);
    },

    _populate_book_window: function() {
        this._bookWindow = new Gtk.Window({ transient_for: this,
                                            modal: true,
                                            title: "Append a new book",
                                            window_position: Gtk.WindowPosition.CENTER_ON_PARENT,
                                            border_width: 6 });

        let dialogGrid = new Gtk.Grid( { row_spacing: 6,
                                         column_spacing: 6 } );

        this._newTitleEntry = new Gtk.Entry();
        this._newAuthorEntry = new Gtk.Entry();

        dialogGrid.attach(new Gtk.Label ({ label: "Title" }),
                          0, 0, 1, 1);
        dialogGrid.attach(this._newTitleEntry,
                          1, 0, 1, 1);
        dialogGrid.attach(new Gtk.Label ({ label: "Author" }),
                          0, 1, 1, 1);
        dialogGrid.attach(this._newAuthorEntry,
                          1, 1, 1, 1);

        let okButton = new Gtk.Button.new_from_stock(Gtk.STOCK_OK);
        okButton.connect("clicked", Lang.bind (this, this._book_window_ok));
        dialogGrid.attach(okButton,
                          0, 2, 2, 1);

        this._bookWindow.add(dialogGrid);
        

        this._bookWindow.connect("delete-event",
                                 Lang.bind (this._bookWindow,
                                            this._bookWindow.hide_on_delete));
    },

    _book_window_cancel: function (dialog, user_data) {
        this._bookWindow.hide();

        this._bookWindowAction = 'none';
    },

    _book_window_ok: function (dialog, response_id) {
        if (this._bookWindowAction == 'new') {
            let title = this._newTitleEntry.get_text();
            let author = this._newAuthorEntry.get_text();
            if (title != "" && author != "") {
                this._bookWindow.hide();

                let book = new workModel.workModel(title, author);
                this._append_book(book);

                this._bookWindowAction = 'none';
            } else {
                let dialog = new Gtk.Dialog({ transient_for: this._bookWindow,
                                              modal: true,
                                              title: "Missing data" });
                dialog.add_button('gtk-ok', Gtk.ResponseType.OK);
                let label = new Gtk.Label({ label: 'Title and author are required.' });
                dialog.get_content_area().add(label);
                label.show();
                dialog.run();
                dialog.destroy();
            }
        }
    },

    _new_book: function() {
        if (!this._bookWindow) {
            this._populate_book_window();
        }
        this._newTitleEntry.set_text('');
        this._newAuthorEntry.set_text('');
        this._bookWindowAction = 'new';
        this._bookWindow.show_all();
    },

    _append_book: function(bookModel) {
        let iter = this._listStore.append();
        this._listStore.set(iter, [ 0, 1 ], [ bookModel.title, bookModel.author ]);
        this._bookshelf[iter] = bookModel;
    },
});
