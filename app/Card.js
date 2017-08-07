"use strict";

module.exports = class Card {
  constructor(id = throwIfMissing('id'), type, fileData) {
    this.id = id; //establishes id of each card
    this.name = ""; //updated in cardbuilder
    this.parentStackID; //only used for ipc listener in sketchpards.js, necessary?
    this.inStack = false; //false if card is not in a stack
    this.channels = []; //for ipc renderer
    this.cardFace; //current card face (used to be called this.carousel)

    //for saving files functionality
    fileData = this.objectCleaner(fileData);
    // this.fileExt = fileData.ext;
    // this.location = fileData.path;

    //for metadata
    this.creation_timestamp = new Date().toString();
    this.interaction_timestamp = this.creation_timestamp;
    // npm module: username, url: https://www.npmjs.com/package/username
    const username = require('username');
    this.creator = username.sync();

    this.cardBuilder(type, fileData);
    this.arrowListeners();
    this.disableSelectable();
    // this.setDraggable();
    // this.setDroppable();
    // ipcRenderer.on("saveComplete", () => $('body').removeClass('waiting'));
  }

  cardBuilder(type, fileData) {
    var card = document.createElement('div');
    $(card).attr({
      id: 'card_' + this.id,
      type: type,
      class: 'card',
    });
    this.card = card;

    var header = document.createElement('div');
    $(header).attr({
      id: 'header_' + this.id,
      class: 'card-header',
    });

    let nameBox = document.createElement("span");
    $(nameBox).addClass("nameBox");
    // if (fileData.name != undefined) {
    //   $(nameBox).html(fileData.name);
    //   this.name = fileData.name
    // } else {
      $(nameBox).html("Card: " + this.id);
      this.name = "Card: " + this.id;
    // }

    $(header).append(nameBox);

    var closeButton = document.createElement('button');
    $(closeButton).attr({
      id: 'close_button_' + this.id,
      class: 'close',
    });
    $(closeButton).click(function() {
      let card = this.closest('.card');
      let id = (card.id).split('_');
      let cleanID = parseInt(id[id.length - 1]);
      delete canvas.currentCards[cleanID];
      card.remove();
      console.log("in close button");
    });

    var saveButton = document.createElement('button');
    $(saveButton).attr({
      id: 'save_button' + this.id,
      class: 'save',
    });
    $(saveButton).click(() => this.saveCard())

    var fullscreenButton = document.createElement('button');
    $(fullscreenButton).attr({
      id: 'fullscreen_button_' + this.id,
      class: 'expand',
    });
    $(fullscreenButton).click(() => this.toggleFullScreen());

    header.appendChild(closeButton);
    header.appendChild(saveButton);
    header.appendChild(fullscreenButton);
    card.appendChild(header);
    document.body.appendChild(card);
  }

  toggleSwipe(value){ //enables user to swipe to a different card face
    $(this.card.lastElementChild).slick('slickSetOption', 'swipe', value, false);
  }

  arrowListeners(){ //shows and hides arrows to enable/disable user to swipe to a different card face
    $(this.card).mouseenter(() => {
      if (this.inStack == false) { //show arrows that enable user to swipe to different card faces
        $(this.card.lastElementChild).find('.slick-arrow').show();
        $(this.card.lastElementChild).find('.slick-dots').show();
      }
    });
    $(this.card).mouseout(() => setTimeout(() => { //hide arrows to prevent user from swiping to different card faces
      if (!$(this.card.lastElementChild).is(':hover') &&
        !$(document.activeElement).hasClass('ace_text-input') ||
        this.inStack == true) { //if not hovering on arrow
        $(this.card.lastElementChild).find('.slick-arrow').hide();
        $(this.card.lastElementChild).find('.slick-dots').hide();
      }
    }, 600));
  }

  buildMetadata(cardType){ //establishes metadata of card(time/date of last interaction, creator, time/date of card creation)
    let id = '#card_' + this.id + cardType + '_2';
    $(id).attr({
      class: 'card-metadata',
    });
    var metadata = 'Interaction: ' + this.interaction_timestamp +
      '<br/><br/>Creator: ' + this.creator +
      '<br/><br/>Created: ' + this.creation_timestamp;
    $(id).html(metadata);
    // $(this.card.lastElementChild).slick('slickGoTo', 0, true);
      return metadata;
  }

  updateMetadata(cardType){ //updates metadata of card
    let id = '#card_' + this.id + cardType + '_2';
    var  updatedMetadata = 'Interaction: ' + new Date().toString() +
    '<br/><br/>Creator: ' + this.creator +
    '<br/><br/>Created: ' + this.creation_timestamp;
    $(id).html(updatedMetadata);
    return updatedMetadata;
  }

  disableSelectable(){ //prevents card from being selected in a group.
    $(".card").hover(() => { // mouse in
      if (canvas.draw == false)
        $(".container").selectable("disable");
    }, () => { // mouse out
      if (canvas.draw == false)
        $(".container").selectable("enable")
    });
  }

  setDraggable(){ //enables card to be draged across the canvas
    $(this.card).draggable({
      handle: '.card-header',
      containment: 'window',
      stack: '.card, .stack',
      start: (event, ui) => {
        $(this.card).removeClass('highlight');
      },
      drag: (event, ui) => {
        this.interaction_timestamp = new Date().toString();
      }
    });
  }

  setDroppable(){ //enables stacks to be created and added to
    $(this.card).droppable({
      accept: '.card, .stack',
      classes: {
        'ui-droppable-hover': 'highlight',
      },
      drop: function(event, ui) {
        let curParent = $(ui.draggable).parent()
        if ($(curParent).hasClass("stack") || $(ui.draggable).hasClass('stack')) { // handle stacked cards
          let curID = curParent[0].id || ui.draggable[0].id
          canvas.currentStacks[curID].addCard($($(this)));
          canvas.currentStacks[curID].addToBack();
          canvas.currentStacks[curID].cascadeCards();
          canvas.currentStacks[curID].resizeStack();
          return;
        }
        //handle card-to-card drop event
        if ($(ui.draggable).hasClass('card')) {
          new Stack($(this), $(ui.draggable));
        }
      },
    });
  }

  toggleFullScreen(){ //toggles card fullscreen mode on and off
    if (!$(this.card).hasClass('fullscreen')) { // transition to fullscreen
      $(this.card).attr('prevStyle', $(this.card)[0].style.cssText);
      $(this.card).addClass('fullscreen').removeAttr('style');
      let height = $(this)[0].card.clientHeight;
      let width = $(this)[0].card.clientWidth;
      // __IPC.ipcRenderer.send('card' + this.id + '_toggle_fullscreen', [height, width]);
      this.channels.push('card' + this.id + '_toggle_fullscreen');
    } else { // transition back from fullscreen
      $(this.card).removeClass('fullscreen');
      $(this.card)[0].style.cssText = $(this.card).attr('prevStyle');
      $(this.card).removeAttr('prevStyle');
      $(this.card.children).each((index, child) => $(child).removeAttr('style'));
      $(this.card).find('*').each((index, child) => $(child).removeClass('fullscreen'));
      // __IPC.ipcRenderer.send('card' + this.id + '_toggle_fullscreen', [250, 200]);
    }
  }

  saveCard(){ //saves content of current card face
    let curIdx = $(this.cardFace).slick("slickCurrentSlide")
    if (this.name.split(" ")[0] == "Card:")
      dialog.showSaveDialog((filePath) => {
        this.location = filePath,
        this.name = filePath.split("/")[filePath.split("/").length - 1],
        this.sendSave(curIdx),
        $(this.card).find(".nameBox").html(this.name)
      });
    else
      this.sendSave(curIdx);
  }

  objectCleaner(fileData){
    for (var key in fileData) {
      if (fileData[key] == undefined)
        fileData[key] = "";
    }
    return fileData;
  }

  destructor() { //removes ipc listeners from card
    this.channels.forEach(ele => __IPC.ipcRenderer.removeAllListeners(ele));
  }
}

function throwIfMissing(param) {
  throw new Error('Missing parameter \'' + param + '\'');
}
