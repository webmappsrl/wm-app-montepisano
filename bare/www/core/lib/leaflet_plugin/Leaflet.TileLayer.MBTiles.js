
// import SQL from 'sql.js';

/*

🍂class TileLayer.MBTiles

Loads tiles from a [`.mbtiles` file](https://github.com/mapbox/mbtiles-spec).

If they exist in the given file, it will handle the following metadata rows:

*/

L.TileLayer.MBTiles = L.TileLayer.extend({
  cordova: false,
  _cStmt: '',

  initialize: function (databaseUrl, options) {

    this._databaseIsLoaded = false;
    if (typeof databaseUrl === 'string') {
      if (databaseUrl.substr(0, 7) === 'file://') {
        this._openCordovaDB(databaseUrl.substr(7));
      } else {
        fetch(databaseUrl).then(function (response) {
          return response.arrayBuffer();
        }).then(function (buffer) {
          this._openDB(buffer);
        }).catch(function (err) {
          this.fire('databaseerror', { error: err });
        });
      }
    } else if (databaseUrl instanceof ArrayBuffer) {
      this._openDB(buffer);
    } else {
      this.fire('databaseerror');
    }

    return L.TileLayer.prototype.initialize.call(this, '', options);
  },

  _openCordovaDB: function (dbPath) {
    this.cordova = true;
    var self = this;
    var basename, pathParts, additionalMapPath;

    /* dvdpzzt changes:
     * as we store base64 directly inside the mbtiles (for android) the query result the same
     */

    this._cStmt = 'SELECT tile_data FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?';
    if (cordova.platformId === 'android') {
      // this._cStmt = 'SELECT BASE64(tile_data) AS base64_tile_data FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?'
      basename = dbPath;
    } else {
      // this._cStmt = 'SELECT tile_data FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?';
      pathParts = dbPath.split('/');
      additionalMapPath = !!localStorage.$wm_mhildId ? 'map_' + localStorage.$wm_mhildId + '/' : 'map/';
      // TODO: instead of .pop(), check the base path and preserve subfolder
      basename = 'NoCloud/' + additionalMapPath + pathParts.pop();
    }
    this._db = sqlitePlugin.openDatabase({
      name: basename,
      iosDatabaseLocation: 'Library'
    }, function () {
      self._initCordovaDb();
    }, function (e) {
      console.log(e);
    });
    window.x = this._db;
  },

  _initCordovaDb: function () {
    var metaStmt = 'SELECT value FROM metadata WHERE name = ?';
    this._db.executeSql(metaStmt, ['attribution'], function (res) {
      if (res.rows.length > 0) {
        this.options.attribution = res.rows.item(0).value;
      }
    }, function (err) {
      console.log(err);
    });
    this._db.executeSql(metaStmt, ['minzoom'], function (res) {
      if (res.rows.length > 0) {
        this.options.minZoom = res.rows.item(0).value;
      }
    }, function (err) {
      console.log(err);
    });
    this._db.executeSql(metaStmt, ['maxzoom'], function (res) {
      if (res.rows.length > 0) {
        this.options.maxZoom = res.rows.item(0).value;
      }
    }, function (err) {
      console.log(err);
    });
    this._db.executeSql(metaStmt, ['format'], function (res) {
      if (res.rows.length > 0) {
        var fmt = res.rows.item(0).value;
        switch (fmt) {
          case 'jpg':
            this._format = 'image/jpg';
            break;
          case 'png':
          default:
            this._format = 'image/png';
        }
      } else {
        this._format = 'image/png';
      }
    }, function (err) {
      console.log(err);
    });
    this.fire('databaseloaded');
    this._databaseIsLoaded = true;
  },

  _openDB: function (buffer) {
    try {
      /// This assumes the `SQL` global variable to exist!!
      this._db = new SQL.Database(new Uint8Array(buffer));
      this._stmt = this._db.prepare('SELECT tile_data FROM tiles WHERE zoom_level = :z AND tile_column = :x AND tile_row = :y');

      // Load some metadata (or at least try to)
      var metaStmt = this._db.prepare('SELECT value FROM metadata WHERE name = :key');
      var row;

      row = metaStmt.getAsObject({ ':key': 'attribution' });
      if (row.value) { this.options.attribution = row.value; }

      row = metaStmt.getAsObject({ ':key': 'minzoom' });
      if (row.value) { this.options.minZoom = Number(row.value); }

      row = metaStmt.getAsObject({ ':key': 'maxzoom' });
      if (row.value) { this.options.maxZoom = Number(row.value); }

      row = metaStmt.getAsObject({ ':key': 'format' });
      if (row.value && row.value === 'png') {
        this._format = 'image/png'
      } else if (row.value && row.value === 'jpg') {
        this._format = 'image/jpg'
      } else {
        // Fall back to PNG, hope it works.
        this._format = 'image/png'
      }

      // 🍂event databaseloaded
      // Fired when the database has been loaded, parsed, and ready for queries
      this.fire('databaseloaded');
      this._databaseIsLoaded = true;

    } catch (ex) {
      // 🍂event databaseloaded
      // Fired when the database could not load for any reason. Might contain
      // an `error` property describing the error.
      this.fire('databaseerror', { error: ex });
    }
  },



  createTile: function (coords, done) {
    var tile = document.createElement('img');

    if (this.options.crossOrigin) {
      tile.crossOrigin = '';
    }

		/*
		 * Alt tag is set to empty string to keep screen readers from reading URL and for compliance reasons
		 * http://www.w3.org/TR/WCAG20-TECHS/H67
		 */
    tile.alt = '';

		/*
		 * Set role="presentation" to force screen readers to ignore this
		 * https://www.w3.org/TR/wai-aria/roles#textalternativecomputation
		 */
    tile.setAttribute('role', 'presentation');

    // In TileLayer.MBTiles, the getTileUrl() method can only be called when
    // the database has already been loaded.
    if (this._databaseIsLoaded) {
      L.DomEvent.on(tile, 'load', L.bind(this._tileOnLoad, this, done, tile));
      L.DomEvent.on(tile, 'error', L.bind(this._tileOnError, this, done, tile));

      tile.src = this.getTileUrl(coords, tile);
    } else {
      this.on('databaseloaded', function () {
        L.DomEvent.on(tile, 'load', L.bind(this._tileOnLoad, this, done, tile));
        L.DomEvent.on(tile, 'error', L.bind(this._tileOnError, this, done, tile));

        tile.src = this.getTileUrl(coords, tile);
      }.bind(this));
    }

    return tile;
  },


  getTileUrl: function (coords, tile) {

    if (this.cordova) {
      var x = coords.x;
      var y = this._globalTileRange.max.y - coords.y;
      var z = coords.z;
      this._db.executeSql(
        this._cStmt,
        [z, x, y],
        function (res) {
          if (res.rows.length > 0) {
            /* dvdpzzt changes:
             * as we store base64 directly inside the mbtiles (for android) and the query is
             * the same for iOS and android, the result is used the same way
             */
            tile.src = 'data:' + this._format + ';base64,' +
              /*(cordova.platformId === 'android' ? res.rows.item(0).base64_tile_data : */res.rows.item(0).tile_data/*)*/;
          }
        },
        function (err) {
          console.log(err);
        }
      );
      return L.Util.emptyImageUrl;
    } else {
      // Luckily, SQL execution is synchronous. If not, this code would get
      // much more complicated.
      var row = this._stmt.getAsObject({
        ':x': coords.x,
        ':y': this._globalTileRange.max.y - coords.y,
        ':z': coords.z
      });

      if ('tile_data' in row) {
        return window.URL.createObjectURL(new Blob([row.tile_data], { type: 'image/png' }));
      } else {
        return L.Util.emptyImageUrl;
      }
    }
  },


});


/*
🍂factory tileLayer.mbTiles(databaseUrl: String, options: TileLayer options)
Returns a new `L.TileLayer.MBTiles`, fetching and using the database given in `databaseUrl`.
🍂alternative
🍂factory tileLayer.mbTiles(databaseBuffer: Uint8Array, options: TileLayer options)
Returns a new `L.TileLayer.MBTiles`, given a MBTiles database as a javascript binary array.
*/
L.tileLayer.mbTiles = function (databaseUrl, options) {
  return new L.TileLayer.MBTiles(databaseUrl, options);
}
