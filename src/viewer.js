/*
 * @copyright 2018 Christoph Wurst <christoph@winzerhof-wurst.at>
 *
 * @author 2018 Christoph Wurst <christoph@winzerhof-wurst.at>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

__webpack_nonce__ = btoa(OC.requestToken)
__webpack_public_path__ = OC.filePath('files_videoplayer', '', 'js/')

var videojs = null;

var videoViewer = {
	UI: {
		show: function () {

			var source = document.createElement('source');
			source.src = escapeHTML(videoViewer.location).replace('&amp;', '&');

			if (videoViewer.mime) {
				source.type = escapeHTML(videoViewer.mime);
			}

			var playerView = document.createElement('video');
			playerView.id = 'my_video_1';
			playerView.classList.add('video-js');
			playerView.classList.add('vjs-fill');
			playerView.classList.add('vjs-big-play-centered');
			playerView.controls = true;
			playerView.preload = "auto";
			playerView.width = "100%";
			playerView.height = "100%";
			playerView.poster = OC.filePath('files_videoplayer', '', 'img') + '/poster.png';
			playerView.setAttribute('data-setup', '{"techOrder": ["html5"]}');
			playerView.appendChild(source);

			if (videoViewer.inline === null) {
				var userDisplayName = $('head').data('user-displayname');

				var overlay = document.createElement('div');
				overlay.id = 'videoplayer_overlay';

				var outer_container = document.createElement('div');
				outer_container.id = 'videoplayer_outer_container';

				var container = document.createElement('div');
				container.id = 'videoplayer_container';

				var player = document.createElement('div');
				player.id = 'videoplayer';

				container.appendChild(player);
				outer_container.appendChild(container);
				overlay.appendChild(outer_container);

				player.appendChild(playerView);
				document.body.appendChild(overlay);

				// close when clicking on the overlay
				overlay.addEventListener('click', function(e) {
					if (e.target === this) {
						videoViewer.hidePlayer();
					}
				});

				setTimeout(() => { overlay.className = 'show'; }, 0);
			} else {
				var wrapper = document.createElement('div');
				wrapper.id = 'videoplayer_view';
				wrapper.appendChild(playerView);
				videoViewer.inline.appendChild(wrapper);
			}
			// initialize player
			videojs("my_video_1", {
				fill: true,
			}).ready(function () {
				videoViewer.player = this;
				if (videoViewer.inline === null) {
					// append close button to video element
					var closeButton = document.createElement('a');
					closeButton.className = 'icon-view-close';
					closeButton.id = 'box-close';
					closeButton.href = '#';
					closeButton.addEventListener('click', function () {
						videoViewer.hidePlayer();
					});
					$('#my_video_1').append('<div class="videojs-watermark-text">' + userDisplayName + '</div>');
					document.getElementById('my_video_1').appendChild(closeButton);
				}
				// autoplay
				if (document.getElementById('body-public') === null) {
					videoViewer.player.play();
				}
			});

		},
		hide: function () {
			var overlay = document.getElementById('videoplayer_overlay');
			overlay.className = '';
			setTimeout(() => {
				overlay.parentElement.removeChild(overlay);
			}, 500);
		}
	},
	mime: null,
	file: null,
	location: null,
	player: null,
	inline: null,
	mimeTypes: [
		'video/mp4',
		'video/x-m4v',
		'video/webm',
		'video/x-flv',
		'video/ogg',
		'video/quicktime',
		'video/x-matroska'
	],
	mimeTypeAliasses: {
		'video/x-matroska': 'video/webm' // mkv support for Chrome. webm uses the same container format
	},
	onView: function (file, data) {
		videoViewer.file = file;
		videoViewer.dir = data.dir;
		videoViewer.location = data.fileList.getDownloadUrl(file, videoViewer.dir);
		videoViewer.mime = data.$file.attr('data-mime');
		if (videoViewer.mimeTypeAliasses.hasOwnProperty(videoViewer.mime)) {
			videoViewer.mime = videoViewer.mimeTypeAliasses[videoViewer.mime];
		}
		videoViewer.showPlayer();
	},
	onViewInline: function (element, file, mime) {
		videoViewer.location = file;
		videoViewer.mime = mime;
		if (videoViewer.mimeTypeAliasses.hasOwnProperty(videoViewer.mime)) {
			videoViewer.mime = videoViewer.mimeTypeAliasses[videoViewer.mime];
		}
		videoViewer.inline = element;
		videoViewer.showPlayer();
	},
	showPlayer: function () {
		import(/* webpackChunkName: "videojs" */ 'video.js').then((_videojs) => {
			videojs = _videojs.default;
			Promise.all([
				import(/* webpackChunkName: "videojs" */ '../css/style.css'),
				import(/* webpackChunkName: "videojs" */'!style-loader!css-loader!video.js/dist/video-js.css')
			]).then(() => {
				videoViewer.UI.show();
			});
		});
	},
	hidePlayer: function () {
		if (videoViewer.player !== null && videoViewer.player !== false && videoViewer.inline === null) {
			videoViewer.player.dispose();
			videoViewer.player = false;
			videoViewer.UI.hide();
		}
	},
	log: function (message) {
		console.log(message);
	}
};

document.addEventListener('DOMContentLoaded', function () {

	// add event to ESC key
	document.addEventListener('keyup', function(e) {
		if ((e.key  !== undefined && e.key === 'Escape') ||
			(e.keyCode !== undefined && e.keyCode === 27)) {
			videoViewer.hidePlayer();
		}
	});

	if (typeof FileActions !== 'undefined' && !OCA.Viewer) {
		for (var i = 0; i < videoViewer.mimeTypes.length; ++i) {
			var mime = videoViewer.mimeTypes[i];
			OCA.Files.fileActions.register(mime, 'View', OC.PERMISSION_READ, '', videoViewer.onView);
			OCA.Files.fileActions.setDefault(mime, 'View');
			if (mime === mimetype) {
				isSupportedMimetype = true;
			}
		}
	}

	// Public page magic
	if (document.getElementById('body-public') && document.getElementById('imgframe')) {
		var mimetype = document.getElementById('mimetype').value;
		for (var i = 0; i < videoViewer.mimeTypes.length; ++i) {
			if (videoViewer.mimeTypes[i] === mimetype) {
				var videoUrl = window.location.href.split('?')[0] + '/download';
				videoViewer.onViewInline(document.getElementById('imgframe'), videoUrl, mimetype);
				break;
			}
		}
	}

});

$(document).ready(function () {
	var positionArray = ["right-top", "right-bottom", "left-bottom", "left-top"];
	var positionCount = 0;
	var watermark = $('.videojs-watermark-text');

	setInterval(function () {
		if (positionArray[positionCount] == "right-top") {
			$('.videojs-watermark-text').css({'left': 'auto', 'right': '20px', 'bottom': '60px', 'top': 'auto'});
		}

		if (positionArray[positionCount] == "right-bottom") {
			$('.videojs-watermark-text').css({'left': '20px', 'right': 'auto', 'bottom': '60px', 'top': 'auto'});
		}

		if (positionArray[positionCount] == "left-bottom") {
			$('.videojs-watermark-text').css({'left': '20px', 'right': 'auto', 'bottom': 'auto', 'top': '60px'});
		}

		if (positionArray[positionCount] == "left-top") {
			$('.videojs-watermark-text').css({'left': 'auto', 'right': '20px', 'bottom': 'auto', 'top': '60px'});
		}

		positionCount++;

		if (positionCount == 4) {
			positionCount = 0;
		}
	}, 50000);
});