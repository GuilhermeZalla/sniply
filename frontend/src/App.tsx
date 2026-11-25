import { Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { Brand, Empty } from "./components/ui";
import { AuthPage } from "./pages/AuthPage";
import { Dashboard } from "./pages/Dashboard";
import { Detail } from "./pages/Detail";
import { EditorPage } from "./pages/EditorPage";
import { GroupsPage } from "./pages/GroupsPage";
import { LibraryPage } from "./pages/LibraryPage";
import { PublicPage } from "./pages/PublicPage";
import { SettingsPage } from "./pages/SettingsPage";
export default function App() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
        <Route path="/reset-password" element={<AuthPage mode="reset" />} />
        <Route path="/share/:slug" element={<PublicPage />} />
        <Route element={<Shell />}>
          <Route index element={<Dashboard />} />
          <Route path="snippets" element={<LibraryPage />} />
          <Route path="favorites" element={<LibraryPage favorites />} />
          <Route path="snippets/new" element={<EditorPage />} />
          <Route path="snippets/:id" element={<Detail />} />
          <Route path="snippets/:id/edit" element={<EditorPage />} />
          <Route
            path="collections"
            element={<GroupsPage kind="collection" />}
          />
          <Route path="tags" element={<GroupsPage kind="tag" />} />
          <Route path="categories" element={<GroupsPage kind="category" />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route
          path="*"
          element={
            <div className="public-page">
              <Brand />
              <Empty
                title="This page is not in your library."
                text="The address may have changed."
                to="/"
                label="Go to overview"
              />
            </div>
          }
        />
      </Routes>
    </>
  );
}
