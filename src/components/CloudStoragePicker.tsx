import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Cloud, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface CloudStoragePickerProps {
  onFileSelected: (file: File, fileName: string) => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    Dropbox?: {
      choose: (options: {
        success: (files: { link: string; name: string; bytes: number }[]) => void;
        cancel: () => void;
        linkType: string;
        multiselect: boolean;
        folderselect: boolean;
      }) => void;
    };
    google?: {
      picker?: {
        PickerBuilder: new () => any;
        ViewId: { DOCS: string };
        Action: { PICKED: string; CANCEL: string };
      };
    };
    gapi?: {
      load: (api: string, callback: () => void) => void;
      client: {
        init: (config: any) => Promise<void>;
        getToken: () => { access_token: string } | null;
      };
      auth2: {
        getAuthInstance: () => {
          signIn: () => Promise<void>;
        };
      };
    };
    OneDrive?: {
      open: (options: {
        clientId: string;
        action: string;
        multiSelect: boolean;
        success: (files: { value: { name: string; "@microsoft.graph.downloadUrl": string; size: number }[] }) => void;
        cancel: () => void;
        error: (error: any) => void;
      }) => void;
    };
  }
}

export const CloudStoragePicker = ({ onFileSelected, disabled }: CloudStoragePickerProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const loadScript = (src: string, id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.getElementById(id)) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.id = id;
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${id}`));
      document.head.appendChild(script);
    });
  };

  const downloadFileFromUrl = async (url: string, fileName: string): Promise<File> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], fileName, { type: blob.type });
  };

  const handleDropbox = async () => {
    setLoading("dropbox");
    try {
      await loadScript("https://www.dropbox.com/static/api/2/dropins.js", "dropboxjs");
      
      if (!window.Dropbox) {
        throw new Error("Dropbox SDK not loaded");
      }

      window.Dropbox.choose({
        success: async (files) => {
          try {
            const file = files[0];
            const downloadedFile = await downloadFileFromUrl(file.link, file.name);
            onFileSelected(downloadedFile, file.name);
          } catch (error) {
            console.error("Error downloading Dropbox file:", error);
            toast({
              title: "Download failed",
              description: "Failed to download file from Dropbox",
              variant: "destructive",
            });
          }
          setLoading(null);
        },
        cancel: () => setLoading(null),
        linkType: "direct",
        multiselect: false,
        folderselect: false,
      });
    } catch (error) {
      console.error("Dropbox error:", error);
      toast({
        title: "Dropbox unavailable",
        description: "Could not connect to Dropbox. Please try uploading directly.",
        variant: "destructive",
      });
      setLoading(null);
    }
  };

  const handleGoogleDrive = async () => {
    setLoading("google");
    toast({
      title: "Google Drive",
      description: "Google Drive integration requires OAuth setup. Please upload files directly for now.",
    });
    setLoading(null);
  };

  const handleOneDrive = async () => {
    setLoading("onedrive");
    toast({
      title: "OneDrive",
      description: "OneDrive integration requires Azure app registration. Please upload files directly for now.",
    });
    setLoading(null);
  };

  const handleBox = async () => {
    setLoading("box");
    toast({
      title: "Box",
      description: "Box integration requires app registration. Please upload files directly for now.",
    });
    setLoading(null);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || !!loading} className="gap-2">
          <Cloud className="h-4 w-4" />
          {loading ? "Loading..." : "Cloud Storage"}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleDropbox} className="gap-2 cursor-pointer">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 2L0 6.5l6 4.5 6-4.5L6 2zm12 0l-6 4.5 6 4.5 6-4.5L18 2zM0 15.5L6 20l6-4.5-6-4.5-6 4.5zm18-4.5l-6 4.5 6 4.5 6-4.5-6-4.5zM6 21.5l6 4.5 6-4.5-6-4.5-6 4.5z"/>
          </svg>
          Dropbox
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleGoogleDrive} className="gap-2 cursor-pointer">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4.433 22l3.885-6.716H22l-3.885 6.716H4.433zm9.204-6.716L7.758 2h7.884l5.879 13.284H13.637zM2 15.284l3.885-6.716L9.77 2 5.885 8.716 2 15.284z"/>
          </svg>
          Google Drive
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOneDrive} className="gap-2 cursor-pointer">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10.085 8.023a6.504 6.504 0 0 1 5.192-2.57 6.5 6.5 0 0 1 5.79 3.534 5.5 5.5 0 0 1-.567 10.963H5.5a5.5 5.5 0 0 1-1.248-10.86 6.5 6.5 0 0 1 5.833-1.067z"/>
          </svg>
          OneDrive
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleBox} className="gap-2 cursor-pointer">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 4h16v16H4V4zm2 2v12h12V6H6z"/>
          </svg>
          Box
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
