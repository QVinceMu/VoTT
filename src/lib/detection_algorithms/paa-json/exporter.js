const fs = require('fs');
const async = require('async');
const path = require('path');
const util = require('util');
const detectionUtils = require('../detectionUtils.js');

const DEFAULT_DATA_SET_NAME = 'json';

// The Exporter interface - provides a mean to export the tagged frames
// data in the expected data format of the detection algorithm
// Constructor parameters:
//  exportDirPath - path to the directory where the exported file will be placed
//  classes - list of classes supported by the tagged data
//  posFramesCount - number of positive tagged frames
//  frameWidth - The width (in pixels) of the image frame
//  frameHeight - The height (in pixels) of the image frame
//  testSplit - the percent of tragged frames to reserve for test set defaults to 20%
function Exporter(exportDirPath, classes, taggedFramesCount, frameWidth, frameHeight, testSplit) {
    var self = this;
    self.dataSetName = DEFAULT_DATA_SET_NAME;
    self.exportDirPath = exportDirPath;
    self.classes = classes;
    self.taggedFramesCount = taggedFramesCount;
    self.frameWidth = frameWidth;
    self.frameHeight = frameHeight;
    self.testFrameIndices = null;
    self.testFrameNames = null;
    self.posFrameLabelIndex = null;
    self.posFrameImageIndex = null;
    self.testSplit = testSplit || 0.2;

    // Prepare everything for exporting (e.g. create metadata files,
    // directories, ..)    
    // Returns: A Promise object that resolves when the operation completes
    this.init = function init() {
        self.posFrameLabelIndex = 0;
        self.posFrameImageIndex = 0;
        self.testFrameNames = [];
        self.testFrameIndices = detectionUtils.generateTestIndecies(self.testSplit, taggedFramesCount);
        self.filesTouched = {};  // Keep track of files we've touched so far
        return new Promise((resolve, reject) => {
            async.waterfall([
                detectionUtils.ensureDirExists.bind(null, self.exportDirPath),      
            ], (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }

    // Export a single frame to the training data
    // Parameters:
    //  frameFileName - The file name to use when saving the image file 
    //  frameBuffer - A buffer with the frame image data 
    //  bboxes  - a list of bboxes in the format of x1, y1, x2, y2 where the
    //           coordinates are in absolute values of the image
    //  tags - a list of objects containing the tagging data. Each object is in the format of:
    //         {'x1' : int, 'y1' : int, 'x2' : int, 'y2' : int, 'class' : string 'w': int, 'h' :int}
    //         Where (x1,y1) and (x2,y2) are the coordinates of the top left and bottom right corner and w an h are optional overloads for the frame demensions
    //         of the bounding boxes (respectively), and 'class' is the name of the class.
    // Returns: A Promise object that resolves when the operation completes
    this.exportFrame = function exportFrame(frameFileName, frameBuffer, tags) {
        return new Promise((resolve,reject)=>{
            async.waterfall([
                function saveImageFrame(cb){
                    var imageFilePath = path.join(self.exportDirPath,frameFileName);
                    fs.writeFile(imageFilePath,frameBuffer,cb);
                    self.posFrameImageIndex++;
                },
                function saveFrameTags(cb){
                    var tagFilePath  = path.join(self.exportDirPath,frameFileName + ".json");
                    var tagObj = {}
                    tagObj["id"] = frameFileName;
                    tagObj["image-url"] = null;
                    tagObj["image-filename"] = frameFileName;
                    regions = []
                    tags.forEach((items)=>{
                        reg = {}
                        reg['tag'] = items['class'];
                        boundingBox = {}
                        boundingBox['left'] = items['x1']/items['w'];
                        boundingBox['top'] = items['y1']/items['h'];
                        boundingBox['width'] = (items['x2'] - items['x1'])/items['w'];
                        boundingBox['height'] = (items['y2'] - items['y1'])/items['h'];
                        reg['region'] = boundingBox;
                        if(tagObj["width"]===undefined){
                            tagObj["width"] = items['w'];
                        }
                        if(tagObj["height"]===undefined){
                            tagObj["height"] = items['h'];
                        }
                        regions.push(reg);
                    })
                    tagObj["regions"] = regions;
                    fs.writeFile(tagFilePath,JSON.stringify(tagObj),cb);
                    self.posFrameLabelIndex++;
                }
            ],(err)=>{
                if(err){
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }
}


exports.Exporter = Exporter;