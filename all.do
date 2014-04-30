for f in $(find src -type f); do
  a="lib/${f#src/}"
  echo "${a%.ls}.js"
done | xargs redo-ifchange
