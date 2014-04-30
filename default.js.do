src="src/${2#lib/}.ls"
dir="$(dirname $1)"

redo-ifchange $src

mkdir -p "$dir"
./node_modules/.bin/lsc -pc "$src"