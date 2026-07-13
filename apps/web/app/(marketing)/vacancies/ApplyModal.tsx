"use client";

import React, { useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { X, UploadCloud, CheckCircle, Loader2 } from "lucide-react";

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubject: string;
}

export default function ApplyModal({ isOpen, onClose, defaultSubject }: ApplyModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fileName, setFileName] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.append("subject", defaultSubject);

    try {
      const res = await fetch("/api/vacancies", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit application.");
      }

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    } else {
      setFileName("");
    }
  };

  const resetAndClose = () => {
    setTimeout(() => {
      setIsSuccess(false);
      setErrorMsg("");
      setFileName("");
    }, 300);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={isSubmitting ? () => {} : resetAndClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 md:p-8 text-left align-middle shadow-2xl transition-all relative">
                <button
                  onClick={resetAndClose}
                  disabled={isSubmitting}
                  className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>

                {isSuccess ? (
                  <div className="text-center py-10">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-6">
                      <CheckCircle className="h-8 w-8 text-emerald-600" />
                    </div>
                    <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-zinc-900 mb-2">
                      Application Sent!
                    </Dialog.Title>
                    <p className="text-sm text-slate-500 mb-8">
                      Thank you for submitting your CV. We have received your application and will be in touch if your profile matches our requirements.
                    </p>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
                      onClick={resetAndClose}
                    >
                      Close Window
                    </button>
                  </div>
                ) : (
                  <>
                    <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-zinc-900 mb-1">
                      {defaultSubject}
                    </Dialog.Title>
                    <p className="text-sm text-slate-500 mb-6">
                      Please fill out the form below and attach your CV.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      {errorMsg && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                          {errorMsg}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label htmlFor="name" className="text-sm font-medium text-slate-700">Full Name <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            placeholder="John Doe"
                            className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-emerald-500 focus:bg-white focus:ring-emerald-500 outline-none transition-all border"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address <span className="text-red-500">*</span></label>
                          <input
                            type="email"
                            name="email"
                            id="email"
                            required
                            placeholder="john@example.com"
                            className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-emerald-500 focus:bg-white focus:ring-emerald-500 outline-none transition-all border"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="message" className="text-sm font-medium text-slate-700">Message / Cover Letter <span className="text-red-500">*</span></label>
                        <textarea
                          name="message"
                          id="message"
                          required
                          rows={4}
                          placeholder="Tell us a bit about yourself..."
                          className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-emerald-500 focus:bg-white focus:ring-emerald-500 outline-none transition-all border resize-none"
                        ></textarea>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Upload CV <span className="text-slate-400 font-normal">(Optional)</span></label>
                        <div className="relative">
                          <input
                            type="file"
                            name="cv"
                            id="cv"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className={`w-full rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${fileName ? "border-emerald-500 bg-emerald-50/50" : "border-slate-200 bg-slate-50 hover:bg-slate-100"}`}>
                            <UploadCloud className={`mx-auto h-8 w-8 mb-2 ${fileName ? "text-emerald-500" : "text-slate-400"}`} />
                            <div className="text-sm text-slate-600">
                              {fileName ? (
                                <span className="font-semibold text-emerald-700">{fileName}</span>
                              ) : (
                                <span><span className="font-semibold text-emerald-600">Click to upload</span> or drag and drop</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">PDF, DOC, DOCX up to 5MB</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Sending Application...
                            </>
                          ) : (
                            "Send Application"
                          )}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
