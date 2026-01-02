
import React, { useState, useRef, useEffect } from 'react';
import { User, GalleryPhoto } from '../types';
import { Plus, Camera, Trash2, Heart, Download, Share2, Search, X, Upload, RefreshCw, Check, Image as ImageIcon, RotateCcw, Loader2 } from 'lucide-react';
import { db } from '../services/databaseService';

interface GalleryPageProps {
  user: User;
  photos: GalleryPhoto[];
  setPhotos: React.Dispatch<React.SetStateAction<GalleryPhoto[]>>;
}

const GalleryPage: React.FC<GalleryPageProps> = ({ user, photos, setPhotos }) => {
  const [showUpload, setShowUpload] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [newPhoto, setNewPhoto] = useState({ title: '', caption: '' });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsCameraStarting(false);
  };

  const startCamera = async () => {
    setImagePreview(null);
    setCameraError(null);
    setIsCameraStarting(true);
    setIsCameraActive(true);
  };

  useEffect(() => {
    let active = true;
    const initCamera = async () => {
      if (isCameraActive && !streamRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, 
            audio: false 
          });
          if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
          streamRef.current = stream;
          const attachStream = () => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              setIsCameraStarting(false);
            } else if (active) { setTimeout(attachStream, 50); }
          };
          attachStream();
        } catch (err) {
          if (active) {
            setCameraError("Could not access camera. Please check permissions.");
            setIsCameraActive(false);
            setIsCameraStarting(false);
          }
        }
      }
    };
    initCamera();
    return () => { active = false; };
  }, [isCameraActive]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setImagePreview(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setImagePreview(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePreview) return;
    setIsUploading(true);

    const photo: GalleryPhoto = {
      photoId: Date.now().toString(),
      imageUrl: imagePreview,
      title: newPhoto.title || 'Untitled Memory',
      caption: newPhoto.caption,
      uploadedBy: user.uid,
      uploaderName: user.displayName,
      isPublic: true,
      createdAt: Date.now(),
    };

    try {
      await db.savePhoto(photo);
      setPhotos(prev => [photo, ...prev]);
      closeUploadModal();
    } catch (err) {
      alert("Gagal menyimpan foto ke database.");
    } finally {
      setIsUploading(false);
    }
  };

  const closeUploadModal = () => {
    stopCamera();
    setShowUpload(false);
    setNewPhoto({ title: '', caption: '' });
    setImagePreview(null);
    setCameraError(null);
  };

  const handleDelete = async (id: string, uploadedBy: string) => {
    if (user.role === 'admin' || user.uid === uploadedBy) {
      if (window.confirm('Delete this precious memory?')) {
        try {
          // Note: In a real app we'd need the UUID from DB, but for now we assume ID matches or use a lookup
          await db.deletePhoto(id); 
          setPhotos(prev => prev.filter(p => p.photoId !== id));
          setSelectedPhoto(null);
        } catch (err) {
          alert("Gagal menghapus foto.");
        }
      }
    } else {
      alert("You can only delete your own photos.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Our Gallery</h1>
          <p className="text-slate-400">Capturing the magic of our journey.</p>
        </div>
        <button 
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 bg-gradient-to-tr from-pink-500 to-purple-600 text-white font-bold px-6 py-3 rounded-2xl shadow-xl active:scale-95 transition-all"
        >
          <Camera size={20} />
          <span>Upload Memory</span>
        </button>
      </header>

      {photos.length === 0 ? (
        <div className="glass rounded-[2.5rem] p-20 text-center flex flex-col items-center space-y-4">
           <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-pink-400 mb-2">
              <Camera size={40} />
           </div>
           <h3 className="text-2xl font-romantic font-bold text-white">No memories yet...</h3>
           <p className="text-slate-500 max-w-sm">Start filling this space with beautiful photos of your time together.</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {photos.map((photo) => (
            <div 
              key={photo.photoId}
              onClick={() => setSelectedPhoto(photo)}
              className="relative group cursor-pointer break-inside-avoid rounded-[2rem] overflow-hidden glass border border-white/10 shadow-lg hover:shadow-pink-500/10 transition-all duration-500"
            >
              <img src={photo.imageUrl} alt={photo.title} className="w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 flex flex-col justify-end">
                <h3 className="text-white font-bold text-lg">{photo.title}</h3>
                <p className="text-slate-300 text-xs line-clamp-1 mt-1">{photo.caption}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Heart size={10} className="fill-pink-500 text-pink-500" /> {photo.uploaderName}
                  </span>
                  <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
                    <Download size={14} className="text-white" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPhoto && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md animate-in zoom-in duration-300">
           <button onClick={() => setSelectedPhoto(null)} className="absolute top-6 right-6 p-3 text-slate-400 hover:text-white transition-colors"><X size={32} /></button>
           <div className="w-full max-w-5xl flex flex-col md:flex-row glass rounded-[2.5rem] overflow-hidden border border-white/10 max-h-[90vh]">
             <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
                <img src={selectedPhoto.imageUrl} alt={selectedPhoto.title} className="max-w-full max-h-full object-contain" />
             </div>
             <div className="w-full md:w-80 p-8 flex flex-col justify-between overflow-y-auto">
               <div>
                 <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-pink-400 bg-pink-500/10 px-3 py-1 rounded-full">Memory</span>
                    <span className="text-xs text-slate-500">{new Date(selectedPhoto.createdAt).toLocaleDateString()}</span>
                 </div>
                 <h2 className="text-2xl font-bold text-white mb-4">{selectedPhoto.title}</h2>
                 <p className="text-slate-400 text-sm leading-relaxed mb-8">{selectedPhoto.caption || "No caption provided for this memory."}</p>
                 <div className="flex items-center gap-3 p-4 glass rounded-2xl border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-500 font-bold">
                       {selectedPhoto.uploaderName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Captured By</p>
                      <p className="text-sm font-bold text-white">{selectedPhoto.uploaderName}</p>
                    </div>
                 </div>
               </div>
               <div className="mt-10 flex gap-4">
                 <button className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center gap-2 text-slate-300 font-bold transition-all"><Share2 size={18} /> Share</button>
                 {(user.role === 'admin' || user.uid === selectedPhoto.uploadedBy) && (
                   <button onClick={() => handleDelete(selectedPhoto.photoId, selectedPhoto.uploadedBy)} className="py-4 px-6 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl transition-all"><Trash2 size={20} /></button>
                 )}
               </div>
             </div>
           </div>
        </div>
      )}

      {showUpload && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
           <div className="w-full max-w-xl glass p-6 md:p-8 rounded-[2.5rem] border border-white/10 shadow-2xl my-auto">
              <h2 className="text-2xl font-bold text-white mb-2">New Memory</h2>
              <p className="text-slate-400 text-sm mb-8">Add a new photo to our collection.</p>
              <form onSubmit={handleUpload} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Title</label>
                    <input type="text" required value={newPhoto.title} onChange={(e) => setNewPhoto({...newPhoto, title: e.target.value})} placeholder="E.g. Summer Vacation..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-white outline-none focus:ring-2 focus:ring-pink-500/50 transition-all text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Caption</label>
                    <input type="text" value={newPhoto.caption} onChange={(e) => setNewPhoto({...newPhoto, caption: e.target.value})} placeholder="The story behind..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-white outline-none focus:ring-2 focus:ring-pink-500/50 transition-all text-sm" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="relative aspect-video rounded-[2rem] overflow-hidden bg-white/5 border border-dashed border-white/10 flex flex-col items-center justify-center min-h-[200px]">
                    {imagePreview ? (
                      <div className="relative w-full h-full">
                        <img src={imagePreview} className="w-full h-full object-cover" alt="preview" />
                        <button type="button" onClick={() => setImagePreview(null)} className="absolute top-4 right-4 p-2 bg-slate-900/80 text-white rounded-full hover:bg-pink-600 transition-colors shadow-lg"><RotateCcw size={16} /></button>
                      </div>
                    ) : isCameraActive ? (
                      <div className="relative w-full h-full bg-black">
                        {isCameraStarting && <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10"><RefreshCw className="text-white animate-spin" size={32} /></div>}
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        {!isCameraStarting && (
                          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6 z-20">
                             <button type="button" onClick={capturePhoto} className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all"><div className="w-10 h-10 border-2 border-slate-900 rounded-full"></div></button>
                             <button type="button" onClick={stopCamera} className="p-3 bg-red-500 text-white rounded-full"><X size={20} /></button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row gap-4 w-full p-6">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 flex flex-col items-center gap-2 p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-pink-500/30 transition-all group">
                           <Upload className="text-pink-400 group-hover:scale-110 transition-transform" size={24} />
                           <span className="text-xs font-bold text-white">From Gallery</span>
                        </button>
                        <button type="button" onClick={startCamera} className="flex-1 flex flex-col items-center gap-2 p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all group">
                           <Camera className="text-purple-400 group-hover:scale-110 transition-transform" size={24} />
                           <span className="text-xs font-bold text-white">Take Photo</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={closeUploadModal} className="flex-1 py-4 text-slate-400 font-bold hover:text-white transition-all">Cancel</button>
                  <button type="submit" disabled={!imagePreview || isUploading} className="flex-1 py-4 bg-gradient-to-tr from-pink-500 to-purple-600 text-white font-bold rounded-2xl shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {isUploading ? <Loader2 className="animate-spin" size={18} /> : "Save Memory"}
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
